import {EventEmitter, Injectable, NgZone} from '@angular/core';
import {ByRegionType, COUNTY, PolygonLayerShortName, polygonLayerShortNames, RegionData} from "../types";
import {Logger, Storage} from "aws-amplify";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService} from "../../services/uiexecution.service";

//TODO: types for the data
class TimeSlice {
  [index: string]: any;

  tweets: string[];
}

const MAX_TWEETS = 100;

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
  private _twitterData: ByRegionType<RegionData<any, number[], string[]>> = {
    county: {stats: {}, count: [], embed: []},
    coarse: {stats: {}, count: [], embed: []},
    fine:   {stats: {}, count: [], embed: []},
  };
  /**
   * This is the semi static stats data which is loaded from assets/data.
   */
  private _stats: ByRegionType<RegionData<any, any, any>> = {
    county: {stats: {}, count: {}, embed: {}},
    coarse: {stats: {}, count: {}, embed: {}},
    fine:   {stats: {}, count: {}, embed: {}}
  };

  public timeKeyedData: any; //The times in the input JSON

  private _gridSizes: ByRegionType<string> = {county: COUNTY, coarse: "15", fine: "60"};


  private _B: number = 1407;//countyStats["cambridgeshire"].length; //number of stats days
  private _updating: boolean;

  constructor(private _http: HttpClient, private _zone: NgZone, private _exec: UIExecutionService) { }

  /**
   * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
   */
  public loadStats(): Promise<any> {
    log.debug("loadStats()");
    return fetch("assets/data/county_stats.json")
      .then(response => response.json())
      .then(json => {
        this._stats.county = json;
      })
      .then(() =>
              fetch("assets/data/coarse_stats.json")
                .then(response => response.json())
                .then(json => {
                  this._stats.coarse = json;
                }))
      .then(() => fetch("assets/data/fine_stats.json")
        .then(response => response.json())
        .then(json => {
          this._stats.fine = json;
        }));
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
      this._exec.state("data-loaded");
      log.debug("Loading live data completed", this._rawTwitterData);
    });


  }

  public embeds(activePolyLayerShortName: PolygonLayerShortName, name: any): string {
    return this._twitterData[activePolyLayerShortName].embed[name];
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
  public updateData(_dateMin, _dateMax) {
    log.debug("update()")
    if (this._updating) {
      log.debug("Update already running.")
      return;
    }
    this._updating = true;

    log.debug("Updating data");
    this.timeKeyedData = this.getTimes();
    this.timeKeyUpdate.emit(this.timeKeyedData);
    // For performance reasons we need to do the
    // next part without triggering Angular
    try {

        this.clearProcessedTweetData();
        this.updateTweetsData(_dateMin, _dateMax);


    } finally {
      log.debug("update() end");
      this._updating = false;
    }
    // if (this._clicked != "") {
    //   this.updateTwitterHeader(this._clicked.target.feature);
    // }
  }

  /**
   * Clears down the {@link _twitterData} field.
   */
  private clearProcessedTweetData() {
    for (const k in this._twitterData) {
      if (this._twitterData.hasOwnProperty(k)) {
        for (const p in (this._twitterData)[k as PolygonLayerShortName]) {
          (this._twitterData)[k as PolygonLayerShortName][p] = {};
        }
      }
    }
  }


  /**
   * Updates the {@link _twitterData} field to contain a processed
   * version of the incoming TimeSlice[] data.
   *
   * @param tweetInfo the raw data to process.
   */
  private updateTweetsData(_dateMin, _dateMax) {

    const {_twitterData, timeKeyedData, _gridSizes} = this;

    for (const i in timeKeyedData.slice(-_dateMax, -_dateMin)) { //all times
      var timeKey = (timeKeyedData.slice(-_dateMax, -_dateMin))[i];
      for (const regionType in _twitterData) { //counties, coarse, fine
        console.assert(polygonLayerShortNames.includes(regionType as PolygonLayerShortName));
        if (_twitterData.hasOwnProperty(regionType)) {
          const timeslicedData: TimeSlice = (this._rawTwitterData)[timeKey];
          for (const place in timeslicedData[(_gridSizes)[regionType]]) { //all counties/boxes
            if (timeslicedData[(_gridSizes)[regionType]].hasOwnProperty(place)) {
              //add the counts
              const wt = timeslicedData[(_gridSizes)[regionType]][place]["w"];
              const tweetsByPolygon: RegionData<any, number[], string[]> = (_twitterData)[regionType];
              if (place in tweetsByPolygon.count) {
                tweetsByPolygon.count[place] += wt;
              } else {
                tweetsByPolygon.count[place] = wt;
                tweetsByPolygon.embed[place] = ""
              }
              for (const i in timeslicedData[_gridSizes[regionType]][place]["i"]) {
                const tweetcode_id = timeslicedData[(_gridSizes)[regionType]][place]["i"][i];
                const tweetcode: string = timeslicedData.tweets[tweetcode_id]; //html of the tweet
                if (tweetcode != "" && tweetsByPolygon.count[place] < MAX_TWEETS) {
                  tweetsByPolygon.embed[place] += "<tr><td>" + tweetcode + "</td></tr>"
                }
              }
            } else {
              log.debug("Skipping " + place);
            }
          }
        } else {
          log.debug("Skipping " + regionType);
        }
      }
    }
  }


  /**
   *
   * @param place
   * @param val
   * @param poly
   * @param B
   * @param statsData
   */
  getStatsIdx(place, val, poly, stats) {

    for (let i = 0; i < this._B; i++) {
      if (val <= stats[poly][place][i]) {
        return i;
      }
    }
    return this._B;
  }

  public entryCount(): number {
    if (this.timeKeyedData) {
      return this.timeKeyedData.length;
    } else {
      return 0;
    }
  }

  public lastEntry() {
    if (this.timeKeyedData) {
      return this.timeKeyedData[this.timeKeyedData.length - 1];
    } else {
      return null;
    }
  }


  public regionTypes(): PolygonLayerShortName[] {
    return Object.keys(this._twitterData).map(i => i as PolygonLayerShortName);
  }

  public regionCounts(regionType: PolygonLayerShortName) {
    return (this._twitterData)[regionType].count;
  }

  public tDiff(_dateMin: number, _dateMax: number) {
    return this.timeKeyedData.slice(-_dateMax, -_dateMin).length / 1440;
  }

  public regionData(regionType: PolygonLayerShortName): RegionData<any, number[], string[]> {
    return this._twitterData[regionType as PolygonLayerShortName];
  }

  public exceedance(place, tweetCount, _dateMin: number, _dateMax: number, regionType) {
    const tdiff = this.tDiff(_dateMin, _dateMax);
    let stats_wt = 0;
    if (tweetCount) {
      var as_day = tweetCount / tdiff; //average # tweets per day arraiving at a constant rate
      stats_wt = this.getStatsIdx(place, as_day, regionType, this._stats); //number of days with fewer tweets
      //exceedance probability = rank / (#days + 1) = p
      //rank(t) = #days - #days_with_less_than(t)
      //prob no events in N days = (1-p)^N
      //prob event in N days = 1 - (1-p)^N
      stats_wt = 100 * (1 - Math.pow(1 - ((this._B + 1 - stats_wt) / (this._B + 1)), tdiff));
    }
    return stats_wt;
  }
}
