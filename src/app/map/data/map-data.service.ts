import {EventEmitter, Injectable, NgZone} from '@angular/core';
import {PolygonLayerShortName, Stats, TimeSlice} from "../types";
import {Cache, Logger, Storage} from "aws-amplify";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService} from "../../services/uiexecution.service";
import {ProcessedData, ProcessedPolygonData} from "./processed-data";
import {Tweet} from "../twitter/tweet";
import {NotificationService} from "../../services/notification.service";
import {NgForage, NgForageCache} from "ngforage";
import {CachedItem} from "ngforage/lib/cache/cached-item";


const log = new Logger('map-data');


@Injectable({
              providedIn: 'root'
            })
export class MapDataService {

  public timeKeyUpdate = new EventEmitter<any>()
  /**
   * The unprocessed twitter data that's come in from the server
   * or null if the data has been processed.
   */
  private _rawTwitterData: TimeSlice[] | null = null;
  /**
   * This is the processed data from the server.
   *
   * @see _rawTwitterData for the unprocessed data.
   */
  private _twitterData: ProcessedData = null;
  /**
   * This is the semi static stats data which is loaded from assets/data.
   */
  private _stats: Stats = {
    county: {stats: {}, count: {}, embed: {}},
    coarse: {stats: {}, count: {}, embed: {}},
    fine:   {stats: {}, count: {}, embed: {}}
  };

  public timeKeyedData: any; //The times in the input JSON


  private _updating: boolean;
  private _statsLoaded: any;

  constructor(private _http: HttpClient, private _zone: NgZone, private _exec: UIExecutionService,
              private _notify: NotificationService, private readonly cache: NgForageCache,
              private readonly ngf: NgForage) { }

  /**
   * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
   */
  public loadStats(): Promise<Stats> {
    log.debug("loadStats()");
    if (this._statsLoaded) {
      log.debug("Stats already loaded;")
      return new Promise(r => r(this._stats));
    }
    return fetch("assets/data/county_stats.json")
      .then(response => response.json())
      .then(json => {
        if (!this._statsLoaded) {
          this._stats.county = Object.freeze(json);
        }
      })
      .then(() => {
        if (!this._statsLoaded) {
          return fetch("assets/data/coarse_stats.json")
            .then(response => response.json())
            .then(json => {
              this._stats.coarse = Object.freeze(json);
              return json;
            }).catch(e => {
              this._notify.error(e)
              return e;
            });
        } else {
          return this._stats;
        }
      })
      .then(() => {
        if (!this._statsLoaded) {
          return fetch("assets/data/fine_stats.json")
            .then(response => response.json())
            .then(json => {
              if (!this._statsLoaded) {
                this._stats.fine = Object.freeze(json);
                this._statsLoaded = true;
                Object.freeze(this._stats);
              }
              return this._stats;
            }).catch(e => {
              this._notify.error(e)
              return e;
            })
        } else {
          return this._stats;
        }
      });
  }

  /**
   * Loads the live data from S3 storage securely.
   */
  public async loadLiveData(): Promise<TimeSlice[]> {
    log.debug("loadLiveData()");
    return <Promise<TimeSlice[]>>Storage.get("live.json")
                                        .then((url: any) =>
                                                this._http.get(url.toString(), {observe: "body", responseType: "json"})
                                                    .toPromise()
                                        );
  }


  public async load() {
    return this._exec.queue("Load Data", ["ready", "map-init", "data-loaded", "data-load-failed"], async () => {
      this._rawTwitterData = await this.loadLiveData() as TimeSlice[];
      this.timeKeyedData = this.getTimes();
      this._exec.changeState("data-loaded");
      log.debug("Loading live data completed", this._rawTwitterData);
    });


  }

  public tweets(activePolyLayerShortName: PolygonLayerShortName, name: any): Tweet[] {
    log.debug(`embeds(${activePolyLayerShortName},${name})`);
    return this._twitterData.embeds(activePolyLayerShortName, name);
  }


  /**
   * @returns reverse sorted time keys from the data
   */
  public getTimes() {
    const time_keys = Object.keys(this._rawTwitterData);
    time_keys.sort();
    time_keys.reverse();
    return time_keys;
  }


  /**
   * This updates the map features and the {@link _twitterData} field
   * with incoming data from the server.
   *
   * @param tweetInfo the data from the server.
   */
  public async updateData(_dateMin, _dateMax) {
    log.debug("update()")
    if (this._updating) {
      log.debug("Update already running.")
      return;
    }
    this._updating = true;

    log.debug("Updating data");
    this.timeKeyedData = this.getTimes();
    // For performance reasons we need to do the
    // next part without triggering Angular
    try {
      await this.updateTweetsData(_dateMin, _dateMax);
    } finally {
      log.debug("update() end");
      this._updating = false;
    }
    this.timeKeyUpdate.emit(this.timeKeyedData);
    // if (this._clicked != "") {
    //   this.updateTwitterHeader(this._clicked.target.feature);
    // }
  }

  /**
   * Updates the {@link _twitterData} field to contain a processed
   * version of the incoming TimeSlice[] data.
   *
   * @param tweetInfo the raw data to process.
   */
  private async updateTweetsData(_dateMin, _dateMax) {
    const key = this.createKey(_dateMin, _dateMax);
    const cacheValue: CachedItem<ProcessedData> = await this.cache.getCached(key);
    if (cacheValue != null && !cacheValue.expired && cacheValue.hasData) {
      log.info("Retrieved tweet data from cache.");
      log.debug(cacheValue);
      this._twitterData = new ProcessedData().populate(cacheValue.data);
      log.debug(this._twitterData)
    } else {
      log.info("Tweet data not in cache.");
      this._twitterData = new ProcessedData(_dateMin, _dateMax, this.timeKeyedData, this._rawTwitterData, this._stats);
      this.cache.setCached(key, this._twitterData, 24 * 60 * 60 * 1000);
    }
  }


  private createKey(_dateMin, _dateMax) {
    const key = `${_dateMin}:${_dateMax}:${this.timeKeyedData}`;
    return key;
  }

  public entryCount(): number {
    if (this.timeKeyedData) {
      return this.timeKeyedData.length;
    } else {
      return 0;
    }
  }

  public lastEntry(): string {
    if (this.timeKeyedData) {
      return this.timeKeyedData[this.timeKeyedData.length - 1];
    } else {
      return null;
    }
  }

  public lastEntryDate(): Date {
    if (this.timeKeyedData) {
      const tstring = this.timeKeyedData[this.timeKeyedData.length - 1];
      return new Date(tstring.substring(0, 4), tstring.substring(4, 6) - 1, tstring.substring(6, 8),
                      tstring.substring(8, 10), tstring.substring(10, 12), 0, 0);
    } else {
      return null;
    }
  }


  public regionTypes(): PolygonLayerShortName[] {
    //Object.keys(this._twitterData).map(i => i as PolygonLayerShortName)
    return this._twitterData.regionTypes();
  }


  public regionData(regionType: PolygonLayerShortName): ProcessedPolygonData {
    return this._twitterData.regionData(regionType);
  }

  public places(regionType: PolygonLayerShortName): Set<string> {
    return this._twitterData.regionData(regionType).places();
  }
}
