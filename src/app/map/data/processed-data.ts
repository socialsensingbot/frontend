import {Tweet} from "../twitter/tweet";
import {
  ByRegionType,
  COUNTY,
  PolygonLayerShortName,
  polygonLayerShortNames,
  RegionData,
  Stats,
  TimeSlice
} from "../types";
import {Logger} from "aws-amplify";

const log = new Logger('processed-data');


export class TweetMap {
  [index: string]: Tweet[];
}

export class CountMap {
  [index: string]: number;
}

export class ExceedanceMap {
  [index: string]: number;
}


export class ProcessedPolygonData {
  private readonly _gridSizes: ByRegionType<string> = Object.freeze({county: COUNTY, coarse: "15", fine: "60"});

  private readonly _B: number = 1407;//countyStats["cambridgeshire"].length; //number of stats days
  private _places: Set<string> = new Set<string>();
  private _stats: ExceedanceMap = new ExceedanceMap();
  private _counts: CountMap = new CountMap();
  private _tweets: TweetMap = new TweetMap();

  constructor(private _name: PolygonLayerShortName = null, dateMin: number = 0, dateMax: number = 0,
              _statsRefData: Stats = null,
              timeKeyedData: any = null, _rawTwitterData: any = null) {

    if (_rawTwitterData === null) {
      //creating empty class for deserializing
    } else {
      const start = new Date();
      const timeSlice = timeKeyedData.slice(-dateMax, -dateMin);
      const tdiff = timeSlice.length / 1440;
      for (const i in timeSlice) { //all times
        var timeKey = timeSlice[i];
        console.assert(polygonLayerShortNames.includes(this._name));
        const timeslicedData: TimeSlice = (_rawTwitterData)[timeKey];
        for (const place in timeslicedData[(this._gridSizes)[_name]]) { //all counties/boxes
          if (timeslicedData[(this._gridSizes)[_name]].hasOwnProperty(place)) {
            //add the counts
            const wt = timeslicedData[(this._gridSizes)[_name]][place]["w"];


            if (this.hasPlace(place)) {
              this._counts[place] += wt;
            } else {
              this._counts[place] = wt;
              this._tweets[place] = [];
              this._places.add(place);
            }
            for (const i in timeslicedData[this._gridSizes[_name]][place]["i"]) {
              const tweetcode_id = timeslicedData[(this._gridSizes)[_name]][place]["i"][i];
              const tweetHtml: string = timeslicedData.tweets[tweetcode_id]; //html of the tweet
              this._tweets[place].push(new Tweet(tweetcode_id, tweetHtml, timeKey, _name, place));
            }
          } else {
            log.debug("Skipping " + place);
          }
        }


      }
      log.debug("Places: ", this._places);
      for (const place of this._places) {
        const tweetCount = this._counts[place]
        let stats_wt = 0;
        if (tweetCount) {
          var as_day = tweetCount / tdiff; //average # tweets per day arraiving at a constant rate
          stats_wt = this.getStatsIdx(place, as_day, _statsRefData); //number of days with fewer tweets
          //exceedance probability = rank / (#days + 1) = p
          //rank(t) = #days - #days_with_less_than(t)
          //prob no events in N days = (1-p)^N
          //prob event in N days = 1 - (1-p)^N
          stats_wt = 100 * (1 - Math.pow(1 - ((this._B + 1 - stats_wt) / (this._B + 1)), tdiff));
        }
        this._stats[place] = stats_wt;
      }
      log.info(`Processed data for ${this._name} in ${(new Date().getTime() - start.getTime()) / 1000.0}s`);
    }
  }

  public hasPlace(place: string) {
    return this._places.has(place);
  }


  /**
   *
   * @param place
   * @param val
   * @param poly
   * @param B
   * @param statsData
   */
  getStatsIdx(place, val, stats) {

    for (let i = 0; i < this._B; i++) {
      if (val <= stats[this._name][place][i]) {
        return i;
      }
    }
    return this._B;
  }


  public exceedanceForPlace(place): number {
    return this._stats[place];
  }

  public places(): Set<string> {
    return this._places;
  }

  public statsForPlace(place: string) {
    return this._stats[place];
  }


  public countForPlace(place: string): number {
    return this._counts[place];
  }

  public tweetsForPlace(name: string) {
    return (typeof this._tweets[name] !== "undefined") ? this._tweets[name] : null;
  }

  public populate(data: ProcessedPolygonData): ProcessedPolygonData {
    this._counts = data._counts;
    this._stats = data._stats;
    this._name = data._name;
    this._tweets = data._tweets;
    for (const i in this._tweets) {
      this._tweets[i] = this._tweets[i].map(i => new Tweet().populate(i))
    }
    this._places = new Set(data._places);
    return this;
  }
}
export class ProcessedData {


  public county: ProcessedPolygonData;
  public coarse: ProcessedPolygonData;
  public fine: ProcessedPolygonData;


  constructor(dateMin: number = 0, dateMax: number = 0, timeKeyedData = null, _rawTwitterData = null,
              _statsRefData: Stats = null) {

    this.county = new ProcessedPolygonData("county", dateMin, dateMax, _statsRefData, timeKeyedData, _rawTwitterData);
    this.coarse = new ProcessedPolygonData("coarse", dateMin, dateMax, _statsRefData, timeKeyedData, _rawTwitterData);
    this.fine = new ProcessedPolygonData("fine", dateMin, dateMax, _statsRefData, timeKeyedData, _rawTwitterData);


  }

  public regionTypes(): PolygonLayerShortName[] {
    return ["county", "coarse", "fine"];
  }

  public embeds(activePolyLayerShortName: PolygonLayerShortName, name: string): Tweet[] {
    return this.layer(activePolyLayerShortName).tweetsForPlace(name)
  }

  public regionNames(activePolyLayerShortName: PolygonLayerShortName): Set<string> {
    return this.layer(activePolyLayerShortName).places();
  }

  private layer(activePolyLayerShortName: PolygonLayerShortName): ProcessedPolygonData {
    switch (activePolyLayerShortName) {
      case "coarse":
        return this.coarse;
      case "fine":
        return this.fine;
      case "county":
        return this.county;
    }
  }

  public regionData(regionType: PolygonLayerShortName): ProcessedPolygonData {
    return this.layer(regionType)
  }

  public populate(cacheValue: ProcessedData) {
    this.county = new ProcessedPolygonData().populate(cacheValue.county);
    this.coarse = new ProcessedPolygonData().populate(cacheValue.coarse);
    this.fine = new ProcessedPolygonData().populate(cacheValue.fine);
    return this;
  }
}
