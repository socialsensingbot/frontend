import {PolygonLayerShortName} from "../types";

export class CSVExportTweet {
  constructor(public id: string, public date: Date, public url: string, public text: string) {

  }

}

/**
 * This class encapsulates the data and functionality for the in memory representation of a tweet.
 * The class is lazily initialized on various data accesses as the full construction of this object includes some CPU intensive tasks.
 */
export class Tweet {
  private _date: Date;
  private _year: string;
  private _month: string;
  private _day: string;
  private _hour: string;
  private _sender: string;
  private _url: string;
  private _valid: boolean;
  private _init: boolean;


  public get date(): Date {
    this.lazyInit();
    return this._date;
  }

  public get year(): string {
    this.lazyInit();
    return this._year;
  }

  public get month(): string {
    this.lazyInit();
    return this._month;
  }

  public get day(): string {
    this.lazyInit();
    return this._day;
  }

  public get hour(): string {
    this.lazyInit();
    return this._hour;
  }

  public get valid(): boolean {
    this.lazyInit();
    return this._valid;
  }

  public get sender(): string {
    this.lazyInit();
    return this._sender;
  }

  public get id(): string {
    return this._id;
  }

  public get url(): string {
    this.lazyInit();
    return this._url;
  }


  get html(): string {
    return this._html;
  }

  get poly(): PolygonLayerShortName {
    return this._poly;
  }

  get place(): string {
    return this._place;
  }

  /**
   * All constructor values bust be optional for the {@link Tweet#populate} method.
   * @param _id the tweet id as defined by Twitter
   * @param _html the html text used tio stub the tweet before the Twitter scripts are called.
   * @param _internalDateString this is a date string in the format supplied by the live.json file.
   * @param _poly type of region map ({@link PolygonLayerShortName}) this is associated with.
   * @param _place the region that this tweet is associated with
   */
  constructor(private _id: string = null, private _html: string = null, private _internalDateString: string = null,
              private _poly: PolygonLayerShortName = null, private _place: string = null) {
  }

  /**
   * Perform lazy initializing of the class. This is called when various accessors need to access fields that are computationally expensive to populate.
   */
  private lazyInit() {
    if (!this._init) {

      const regex = /.*<a href="https:\/\/twitter.com\/(\w+)\/status\/(\d+).*">.*<\/a><\/blockquote>/;
      const matched = this._html.match(regex);
      this._valid = (matched != null);
      if (matched) {
        this._sender = matched[1];
        console.assert(this._id == matched[2]);
        this._url = "https://twitter.com/" + this._sender + "/status/" + this._id
      }
      this._date = new Date(Number(this._internalDateString.substring(0, 4)),
                            Number(this._internalDateString.substring(4, 6)) - 1,
                            Number(this._internalDateString.substring(6, 8)),
                            Number(this._internalDateString.substring(8, 10)),
                            +Number(this._internalDateString.substring(10, 12)), 0, 0);
      this._year = new Intl.DateTimeFormat('en', {year: '2-digit'}).format(this._date);
      this._month = new Intl.DateTimeFormat('en', {month: 'short'}).format(this._date);
      this._day = new Intl.DateTimeFormat('en', {day: '2-digit'}).format(this._date);
      this._hour = new Intl.DateTimeFormat('en', {hour: '2-digit', hour12: true}).format(this._date);

      this._init = true;
    }
  }

  /**
   * Populate this tweet from data from a Tweet like structure. Primarily used to copy a deserialized Tweet which is not a class but a Tweet like class.
   *
   * @param tweet the {@link Tweet} to copy data from.
   */
  public populate(tweet: Tweet): Tweet {
    this._id = tweet._id;
    this._html = tweet._html;
    this._internalDateString = tweet._internalDateString;
    this._poly = tweet._poly;
    this._place = tweet._place;
    this._date = tweet._date;
    this._year = tweet._year;
    this._month = tweet._month;
    this._day = tweet._day;
    this._hour = tweet._hour;
    this._sender = tweet._sender;
    this._url = tweet._url;
    this._valid = tweet._valid;
    this._init = tweet._init;
    return this;
  }

  public asCSV(): CSVExportTweet {
    this.lazyInit();
    return new CSVExportTweet(this._id, this._date, this._url, this._html.replace(/<[^>]+>/g, ""));
  }
}


