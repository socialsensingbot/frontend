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
  private _gridSizes: ByRegionType<string> = Object.freeze({county: COUNTY, coarse: "15", fine: "60"});

  private _B: number = 1407;//countyStats["cambridgeshire"].length; //number of stats days
  private _tdiff: number;
  private _places: Set<string> = new Set<string>();

  constructor(private _name: PolygonLayerShortName, dateMin: number, dateMax: number, private _statsRefData: Stats,
              private timeKeyedData: any, _rawTwitterData: any) {
    this._tdiff = timeKeyedData.slice(-dateMax, -dateMin).length / 1440;
    for (const i in timeKeyedData.slice(-dateMax, -dateMin)) { //all times
      var timeKey = (timeKeyedData.slice(-dateMax, -dateMin))[i];
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
            const tweetcode: string = timeslicedData.tweets[tweetcode_id]; //html of the tweet
            if (tweetcode != "" && this._counts[place] < MAX_TWEETS) {
              this._tweets[place].push(new Tweet(tweetcode_id, tweetcode, i, _name, place));
            }
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
        var as_day = tweetCount / this._tdiff; //average # tweets per day arraiving at a constant rate
        stats_wt = this.getStatsIdx(place, as_day, this._statsRefData); //number of days with fewer tweets
        //exceedance probability = rank / (#days + 1) = p
        //rank(t) = #days - #days_with_less_than(t)
        //prob no events in N days = (1-p)^N
        //prob event in N days = 1 - (1-p)^N
        stats_wt = 100 * (1 - Math.pow(1 - ((this._B + 1 - stats_wt) / (this._B + 1)), this._tdiff));
      }
      this._stats[place] = stats_wt;
    }
  }

  public hasPlace(place: string) {
    return this._places.has(place);
  }

  private _stats: ExceedanceMap = new ExceedanceMap();
  private _counts: CountMap = new CountMap();
  private _tweets: TweetMap = new TweetMap();


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
    return this._tweets[name];
  }
}

const MAX_TWEETS = 100;

export class ProcessedData {


  public county: ProcessedPolygonData;
  public coarse: ProcessedPolygonData;
  public fine: ProcessedPolygonData;


  constructor(dateMin: number, dateMax: number, timeKeyedData, _rawTwitterData, _statsRefData: Stats) {

    this.county = new ProcessedPolygonData("county", dateMin, dateMax, _statsRefData, timeKeyedData, _rawTwitterData);
    this.coarse = new ProcessedPolygonData("county", dateMin, dateMax, _statsRefData, timeKeyedData, _rawTwitterData);
    this.fine = new ProcessedPolygonData("county", dateMin, dateMax, _statsRefData, timeKeyedData, _rawTwitterData);


  }

  public regionTypes(): PolygonLayerShortName[] {
    return ["county", "coarse", "fine"];
  }

  public embeds(activePolyLayerShortName: PolygonLayerShortName, name: string): Tweet[] {
    return this.layer(activePolyLayerShortName).tweetsForPlace(name)
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
}
