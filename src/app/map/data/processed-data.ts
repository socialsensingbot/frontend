import {Tweet} from "../twitter/tweet";
import {
  ByRegionType,
  COUNTY,
  Stats,
  TimeSlice
} from "../types";
import {Logger} from "aws-amplify";

const log = new Logger("processed-data");


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

  private readonly _B: number = 1613; // countyStats["cambridgeshire"].length; //number of stats days
  private _places: Set<string> = new Set<string>();
  private _stats: ExceedanceMap = new ExceedanceMap();
  private _counts: CountMap = new CountMap();
  private _tweets: TweetMap = new TweetMap();

  constructor(private _name: string = null, dateMin: number = 0, dateMax: number = 0,
              _statsRefData: Stats = null,
              timeKeyedData: any = null, _rawTwitterData: any = null) {

    if (_rawTwitterData === null) {
      // creating empty class for deserializing
    } else {
      const start = new Date();
      const timeSlice = timeKeyedData.slice(-dateMax, -dateMin);
      const tdiff = timeSlice.length / 1440;
      for (const i in timeSlice) { // all times
        const timeKey = timeSlice[i];
        const timeslicedData: TimeSlice = (_rawTwitterData)[timeKey];
        for (const place in timeslicedData[(this._gridSizes)[_name]]) { // all counties/boxes
          if (timeslicedData[(this._gridSizes)[_name]].hasOwnProperty(place)) {
            // add the counts
            const wt = timeslicedData[(this._gridSizes)[_name]][place].w;


            if (this.hasPlace(place)) {
              this._counts[place] += wt;
            } else {
              this._counts[place] = wt;
              this._tweets[place] = [];
              this._places.add(place);
            }
            for (const j in timeslicedData[this._gridSizes[_name]][place].i) {
              const tweetcodeId = timeslicedData[(this._gridSizes)[_name]][place].i[j];
              const tweetHtml: string = timeslicedData.tweets[tweetcodeId]; // html of the tweet
              this._tweets[place].push(new Tweet(tweetcodeId, tweetHtml, timeKey, _name, place));
            }
          } else {
            log.debug("Skipping " + place);
          }
        }


      }
      log.debug("Places: ", this._places);
      for (const place of this._places) {
        const tweetCount = this._counts[place];
        let statsWt = 0;
        if (tweetCount) {
          const asDay = tweetCount / tdiff; // average # tweets per day arraiving at a constant rate
          statsWt = this.getStatsIdx(place, asDay, _statsRefData); // number of days with fewer tweets
          // exceedance probability = rank / (#days + 1) = p
          // rank(t) = #days - #days_with_less_than(t)
          // prob no events in N days = (1-p)^N
          // prob event in N days = 1 - (1-p)^N
          statsWt = 100 * (1 - Math.pow(1 - ((this._B + 1 - statsWt) / (this._B + 1)), tdiff));
        }
        this._stats[place] = statsWt;
      }
      log.info(`Processed data for ${this._name} in ${(new Date().getTime() - start.getTime()) / 1000.0}s`);
    }
  }

  public hasPlace(place: string) {
    return this._places.has(place);
  }


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
      this._tweets[i] = this._tweets[i].map(i => new Tweet().populate(i));
    }
    this._places = new Set(data._places);
    return this;
  }
}

export class ProcessedData {


  data: { [regionType: string]: ProcessedPolygonData } = {};


  constructor(dateMin: number = 0, dateMax: number = 0, timeKeyedData = null, _rawTwitterData = null,
              _statsRefData: Stats = null, layers: string[] = []) {

    for (const layer of layers) {
      this.data[layer] = new ProcessedPolygonData(layer, dateMin, dateMax, _statsRefData, timeKeyedData,
                                                  _rawTwitterData);
    }
  }

  public tweets(activePolyLayerShortName: string, name: string): Tweet[] {
    return this.layer(activePolyLayerShortName).tweetsForPlace(name);
  }

  public regionNames(activePolyLayerShortName: string): Set<string> {
    return this.layer(activePolyLayerShortName).places();
  }

  private layer(activePolyLayerShortName: string): ProcessedPolygonData {
    return this.data[activePolyLayerShortName];
  }

  public regionData(regionType: string): ProcessedPolygonData {
    return this.layer(regionType);
  }

  public populate(processedData: ProcessedData, layers: string[]) {
    log.debug(processedData);
    log.debug(this.data);
    for (const layer of layers) {
      this.data[layer] = new ProcessedPolygonData().populate(processedData.data[layer]);
    }
    return this;
  }
}
