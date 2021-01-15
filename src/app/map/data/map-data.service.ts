import {EventEmitter, Injectable, NgZone} from "@angular/core";
import {Geometry, PolygonData, RegionData, TimeSlice} from "../types";
import {Logger} from "@aws-amplify/core";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService} from "../../services/uiexecution.service";
import {ProcessedData, ProcessedPolygonData} from "./processed-data";
import {CSVExportTweet, Tweet} from "../twitter/tweet";
import {NotificationService} from "../../services/notification.service";
import {NgForage, NgForageCache} from "ngforage";
import {CachedItem} from "ngforage/lib/cache/cached-item";
import {ExportToCsv} from "export-to-csv";
import {PreferenceService} from "../../pref/preference.service";
import {toTitleCase} from "../../common";
import * as geojson from "geojson";
import {environment} from "../../../environments/environment";
import Storage from "@aws-amplify/storage";


const log = new Logger("map-data");


export interface DataSet {
  __typename: "DataSet";
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}


export interface RegionMetadata {
  id: string;
  title: string;
  key: string;
}


export interface LayerMetadata {
  id: string;
  /**
   * which data source does this come from e.g. pollution-monitoring, twitter
   */
  source: string;
  /**
   * What hazard does this data represent if any e.g. flood, pollution.
   */
  hazard?: string;
  /**
   * Where, relative to the top level metadata.json file can we find this layer's data.
   */
  file: string;
}

/**
 * The layer group consists of a set of layers grouped together to form one visual result.
 */
export interface LayerGroupMetadata {
  id: string;
  title: string;
  layers: string[];
}

export interface StartMetadata {
  "lat": number;
  "lng": number;
  "zoom": number;
}


export interface DataSetMetadata {
  id: string;
  title: string;
  version?: string;
  regionGroups: RegionMetadata[];
  layerGroups: LayerGroupMetadata[];
  defaultLayerGroup: string;
  layers: LayerMetadata[];
  start: StartMetadata;
  location: string;
  hazards: string[];
}

export interface DataSetCoreMetadata {
  id: string;
  title: string;
}

interface ServiceMetadata {
  version?: string;
  datasets: DataSetCoreMetadata[];
  start?: StartMetadata;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

@Injectable({
              providedIn: "root"
            })
export class MapDataService {
  public polygonData: {
    [regionName: string]: geojson.GeoJsonObject
  } = {};


  public timeKeyUpdate = new EventEmitter<any>();
  /**
   * This is the semi static stats data which is loaded from assets/data.
   */
  public stats: { [regionName: string]: any } = {};
  public reverseTimeKeys: any; // The times in the input JSON
  public dataset: string;
  public dataSetMetdata: DataSetMetadata;
  public serviceMetadata: ServiceMetadata;
  public availableDataSets: DataSetCoreMetadata[];
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
  private _updating: boolean;
  private initialized: boolean;

  constructor(private _http: HttpClient, private _zone: NgZone, private _exec: UIExecutionService,
              private _notify: NotificationService, private readonly cache: NgForageCache,
              private readonly ngf: NgForage,
              private _pref: PreferenceService) {

  }

  public async init() {

    return this.loadFromS3("metadata.json", environment.version, 30 * 1000)
               .then(async i => {
                 await this._pref.waitUntilReady();
                 this.serviceMetadata = i;
                 if (this._pref.combined.availableDataSets
                   && this._pref.combined.availableDataSets.length > 0
                   && this._pref.combined.availableDataSets[0] !== "*") {
                   this.availableDataSets = this.serviceMetadata.datasets.filter(
                     ds => this._pref.combined.availableDataSets.includes(ds.id));
                 } else {
                   this.availableDataSets = this.serviceMetadata.datasets;
                 }
               }).finally(() => {
        this.initialized = true;
        this._notify.dismiss();
      });
  }

  /**
   * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
   */
  public async loadStats() {
    log.debug("loadStats()");
    const version = environment.version + ":" + this.dataSetMetdata.version;
    const promises = {};
    if (this._pref.combined.showLoadingMessages) {
      this._notify.show("Loading reference data ...", "OK", 60);
    }
    for (const regionGroup of this.dataSetMetdata.regionGroups) {
      // Note the use of a random time to make sure that we don't refresh all datasets at once!!
      const cacheDuration = ONE_DAY * (7.0 + 7.0 * Math.random());
      promises["stats:" + regionGroup.id] = (this.loadFromS3(
        this.dataset + "/regions/" + regionGroup.id + "/" + this.getCurrentLayer().id + "-stats.json", version,
        cacheDuration));
      promises["features:" + regionGroup.id] = (this.loadFromS3(
        this.dataset + "/regions/" + regionGroup.id + "/features.json", version, cacheDuration,
      ));
    }
    for (const regionGroup of this.dataSetMetdata.regionGroups) {
      if (this._pref.combined.showLoadingMessages) {
        this._notify.show("Loading '" + regionGroup.title + "' statistics...", "OK", 60);
      }
      this.stats[regionGroup.id] = (await promises["stats:" + regionGroup.id]) as RegionData<any, any, any>;
      if (this._pref.combined.showLoadingMessages) {
        this._notify.show("Loading '" + regionGroup.title + "' geography ...", "OK", 60);
      }
      this.polygonData[regionGroup.id] = (await promises["features:" + regionGroup.id]) as geojson.GeoJsonObject;
    }
    this._notify.dismiss();
  }


  /**
   * Loads the live data from S3 storage securely.
   */
  public async loadLiveData(): Promise<TimeSlice[]> {
    log.debug("loadLiveData()");
    // TODO :- use the defaultLayerGroup to select a layergroup and then load the layers into seperate layer
    //  datastructures and return those instead.
    //
    const result = this.loadFromS3(this.getCurrentLayer().file, environment.version, 2 * 1000,
                                   "Loading Twitter data ...").finally(() => this._notify.dismiss());
    return result as Promise<TimeSlice[]>;
  }

  public async load() {
    return await this._exec.queue("Load Data", ["ready", "map-init", "data-loaded", "data-load-failed"], async () => {
      this._rawTwitterData = await this.loadLiveData() as TimeSlice[];
      this.reverseTimeKeys = this.getTimes();
      this._exec.changeState("data-loaded");
      log.debug("Loading live data completed", this._rawTwitterData);
    }, Date.now(), true, true, true);


  }

  public tweets(activePolyLayerShortName: string, names: string[]):
    Tweet[] {
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

  public regionData(regionType: string): ProcessedPolygonData {
    return this._twitterData.regionData(regionType);
  }

  public places(regionType: string): Set<string> {
    return this._twitterData.regionData(regionType).places();
  }

  offset(dateInMillis: number):
    number {
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

  public download(regionGrouping: string, polygonDatum: PolygonData) {
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
    for (const region of this._twitterData.regionNames(regionGrouping).keys()) {
      let geometry;
      for (const feature of polygonDatum.features) {
        if (feature.id === region) {
          geometry = feature.geometry;
        }
      }
      if (typeof geometry === "undefined") {
        log.warn("No geometry for " + region);
      } else {
        exportedTweets.push(...this.downloadRegion(regionGrouping, region, geometry));
      }
    }
    const csvExporter = new ExportToCsv(options);
    csvExporter.generateCsv(exportedTweets);


  }

  public async switchDataSet(dataset: string) {
    if (!this.initialized) {
      this._notify.error("Map Data Service not Initialized");
    }
    this.dataset = dataset;
    this.dataSetMetdata = await this.loadFromS3(this.dataset + "/metadata.json",
                                                environment.version + ":" + this.serviceMetadata.version,
                                                10 * 1000) as DataSetMetadata;
    this._notify.dismiss();
  }

  public regionTypes() {
    return this.dataSetMetdata.regionGroups.map(i => i.id);
  }

  private getCurrentLayer() {
    return this.dataSetMetdata.layers[0];
  }

  private async loadFromS3(name: string, version: string = environment.version, cacheDuration = ONE_DAY,
                           loadingMessage: string = null) {
    const key = `${environment.name}:${version}:${name}`;
    const cacheValue: CachedItem<any> = await this.cache.getCached(key);
    if (cacheValue != null && !cacheValue.expired && cacheValue.hasData && cacheValue.data) {
      log.info(`Retrieved ${name} from cache (${key}) .`);
      log.debug(cacheValue);
      return cacheValue.data;
    } else {
      log.info(`${name} not in cache.`);
      if (loadingMessage !== null && this._pref.combined.showLoadingMessages) {
        this._notify.show(loadingMessage, "OK", 60);
      }
      const url = await Storage.get(name);
      const jsonData = await this._http.get(url.toString(), {observe: "body", responseType: "json"})
                                 .toPromise();
      this.cache.setCached(key, jsonData, cacheDuration);
      return jsonData;
    }
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
    if (environment.cacheProcessedTweets && cacheValue != null && !cacheValue.expired && cacheValue.hasData && cacheValue.data) {
      log.info("Retrieved tweet data from cache.", cacheValue.data);
      log.debug(cacheValue);
      this._twitterData = new ProcessedData().populate(cacheValue.data, this.regionTypes());
      log.debug(this._twitterData);
    } else {
      log.info("Tweet data not in cache.");
      this._twitterData = new ProcessedData(_dateMin, _dateMax, this.reverseTimeKeys, this._rawTwitterData,
                                            this.stats, this.dataSetMetdata.regionGroups);
      this.cache.setCached(key, this._twitterData, ONE_DAY);
    }
  }

  private createKey(_dateMin, _dateMax) {
    const key = `${environment.version}:${this.serviceMetadata.version}:${this.dataSetMetdata.version};${this.dataset}${_dateMin}:${_dateMax}:${this.reverseTimeKeys}`;
    return key;
  }

  private downloadRegion(regionGrouping: string, region: string, geometry: Geometry): CSVExportTweet[] {
    const regionMap = {};
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
      regionMap[region] = `(${minX},${minY}),(${maxX},${maxY})`;
    } else {
      regionMap[region] = toTitleCase(region);
    }
    log.verbose("Exporting egion: " + region);
    return this._twitterData.tweets(regionGrouping, region)
               .filter(i => i.valid && !this._pref.isBlacklisted(i))
               .map(i => i.asCSV(regionMap, this._pref.combined.sanitizeForGDPR));

  }
}
