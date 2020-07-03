import {EventEmitter, Injectable, NgZone} from "@angular/core";
import {PolygonData, PolygonLayerShortName, Stats, TimeSlice, Geometry} from "../types";
import {Cache, Logger, Storage} from "aws-amplify";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService} from "../../services/uiexecution.service";
import {ProcessedData, ProcessedPolygonData} from "./processed-data";
import {CSVExportTweet, Tweet} from "../twitter/tweet";
import {NotificationService} from "../../services/notification.service";
import {NgForage, NgForageCache} from "ngforage";
import {CachedItem} from "ngforage/lib/cache/cached-item";
import {environment} from "../../../environments/environment";
import {ExportToCsv} from "export-to-csv";
import {GeoJsonObject} from "geojson";
import {PreferenceService} from "../../pref/preference.service";
import {toTitleCase} from "../../common";


const log = new Logger("map-data");


@Injectable({
              providedIn: "root"
            })
export class MapDataService {


  public timeKeyUpdate = new EventEmitter<any>();
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

  public reverseTimeKeys: any; // The times in the input JSON


  private _updating: boolean;
  private _statsLoaded: any;

  constructor(private _http: HttpClient, private _zone: NgZone, private _exec: UIExecutionService,
              private _notify: NotificationService, private readonly cache: NgForageCache,
              private readonly ngf: NgForage,
              private _pref: PreferenceService) { }

  /**
   * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
   */
  public loadStats(): Promise<Stats> {
    log.debug("loadStats()");
    if (this._statsLoaded) {
      log.debug("Stats already loaded;");
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
            });
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
    return Storage.get("live.json")
                  .then((url: any) =>
                          this._http.get(url.toString(), {observe: "body", responseType: "json"})
                              .toPromise()
                  ) as Promise<TimeSlice[]>;
  }


  public async load() {
    return await this._exec.queue("Load Data", ["ready", "map-init", "data-loaded", "data-load-failed"], async () => {
      this._rawTwitterData = await this.loadLiveData() as TimeSlice[];
      this.reverseTimeKeys = this.getTimes();
      this._exec.changeState("data-loaded");
      log.debug("Loading live data completed", this._rawTwitterData);
    }, Date.now(), true, true, true);


  }

  public tweets(activePolyLayerShortName: PolygonLayerShortName, names: string[]): Tweet[] {
    log.debug(`tweets(${activePolyLayerShortName},${name})`);
    const tweets: Tweet[] = [];
    for (const name of names) {
      const t = this._twitterData.tweets(activePolyLayerShortName, name);
      if (t) {
        tweets.push(...t);
      }
    }
    return tweets;
  }


  /**
   * @returns reverse sorted time keys from the data
   */
  public getTimes() {
    const timeKeys = Object.keys(this._rawTwitterData);
    timeKeys.sort();
    timeKeys.reverse();
    return timeKeys;
  }


  /**
   * This updates the map features and the {@link _twitterData} field
   * with incoming data from the server.
   *
   * @param tweetInfo the data from the server.
   */
  public async update(_dateMin: number, _dateMax: number) {
    log.debug("update()");
    if (this._updating) {
      log.debug("Update already running.");
      return;
    }
    this._updating = true;

    log.debug("Updating data");
    this.reverseTimeKeys = this.getTimes();
    // For performance reasons we need to do the
    // next part without triggering Angular
    try {
      await this.updateTweetsData(this.offset(_dateMin), this.offset(_dateMax));
    } finally {
      log.debug("update() end");
      this._updating = false;
    }
    this.timeKeyUpdate.emit(this.reverseTimeKeys);
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
      log.debug(this._twitterData);
    } else {
      log.info("Tweet data not in cache.");
      this._twitterData = new ProcessedData(_dateMin, _dateMax, this.reverseTimeKeys, this._rawTwitterData,
                                            this._stats);
      this.cache.setCached(key, this._twitterData, 24 * 60 * 60 * 1000);
    }
  }


  private createKey(_dateMin, _dateMax) {
    const key = `${_dateMin}:${_dateMax}:${this.reverseTimeKeys}`;
    return key;
  }

  public entryCount(): number {
    if (this.reverseTimeKeys) {
      return this.reverseTimeKeys.length;
    } else {
      return 0;
    }
  }

  public lastEntryDate(): Date {
    if (this.reverseTimeKeys) {
      const tstring = this.reverseTimeKeys[0];
      return this.parseTimeKey(tstring);
    } else {
      return null;
    }
  }

  public entryDate(offset: number): Date {
    if (this.reverseTimeKeys) {
      const tstring = this.reverseTimeKeys[-offset];
      return this.parseTimeKey(tstring);
    } else {
      return null;
    }
  }

  public parseTimeKey(tstring) {
    return new Date(Date.UTC(tstring.substring(0, 4), tstring.substring(4, 6) - 1, tstring.substring(6, 8),
                             tstring.substring(8, 10), tstring.substring(10, 12), 0, 0));
  }

  public regionTypes(): PolygonLayerShortName[] {
    // Object.keys(this._twitterData).map(i => i as PolygonLayerShortName)
    return this._twitterData.regionTypes();
  }


  public regionData(regionType: PolygonLayerShortName): ProcessedPolygonData {
    return this._twitterData.regionData(regionType);
  }

  public places(regionType: PolygonLayerShortName): Set<string> {
    return this._twitterData.regionData(regionType).places();
  }

  offset(dateInMillis: number): number {
    const dateFull = new Date(dateInMillis);
    const ye = dateFull.getFullYear();
    const mo = ((dateFull.getUTCMonth() + 1) + "").padStart(2, "0");
    const da = (dateFull.getUTCDate() + "").padStart(2, "0");
    const hr = (dateFull.getUTCHours() + "").padStart(2, "0");
    const min = (dateFull.getUTCMinutes() + "").padStart(2, "0");


    const date = `${ye}${mo}${da}${hr}${min}`;
    log.debug(`DATE: ${dateFull} = ${date}`);
    let count = 0;
    for (const timeKey of this.reverseTimeKeys) {
      if (timeKey <= date) {
        return -count;
      }
      count++;
    }
    return -this.reverseTimeKeys.length + 1;
  }

  private downloadRegion(polyType: PolygonLayerShortName, region: string, geometry: Geometry): CSVExportTweet[] {
    let regionText = region;
    if (region.match(/\d+/)) {
      let minX = null;
      let maxX = null;
      let minY = null;
      let maxY = null;
      for (const point of geometry.coordinates[0]) {
        if (minX === null || point[0] < minX) {
          minX = point[0];
        }
        if (minY === null || point[1] < minY) {
          minY = point[1];
        }
        if (maxX === null || point[0] > maxX) {
          maxX = point[0];
        }
        if (maxY === null || point[1] > maxY) {
          maxY = point[1];
        }
      }
      log.verbose(
        `Bounding box of ${JSON.stringify(geometry.coordinates[0])} is (${minX},${minY}) to (${maxX},${maxY})`);
      regionText = `(${minX},${minY}),(${maxX},${maxY})`;
    }
    log.verbose("Exporting egion: " + region);
    return this._twitterData.tweets(polyType, region)
               .filter(i => i.valid && !this._pref.isBlacklisted(i))
               .map(i => i.asCSV(toTitleCase(regionText)));

  }

  public download(polyType: PolygonLayerShortName, polygonDatum: PolygonData) {
    const exportedTweets: CSVExportTweet[] = [];
    const options = {
      fieldSeparator:   ",",
      quoteStrings:     "\"",
      decimalSeparator: ".",
      showLabels:       true,
      showTitle:        false,
      title:            "",
      useTextFile:      false,
      useBom:           true,
      useKeysAsHeaders: true,
      filename:         "global-tweet-export"
      // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
    };
    for (const region of this._twitterData.regionNames(polyType).keys()) {
      let geometry;
      for (const feature of polygonDatum.features) {
        if (feature.id === region) {
          geometry = feature.geometry;
        }
      }
      if (typeof geometry === "undefined") {
        log.warn("No geometry for " + region);
      } else {
        exportedTweets.push(...this.downloadRegion(polyType, region, geometry));
      }
    }
    const csvExporter = new ExportToCsv(options);
    csvExporter.generateCsv(exportedTweets);


  }
}
