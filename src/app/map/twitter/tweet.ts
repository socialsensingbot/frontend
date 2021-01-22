import {environment} from "../../../environments/environment";

export class CSVExportTweet {
  constructor(public region: string, public id: string, public date: string, public url: string, public text: string,
              public impact: string) {

  }

}

/**
 * This class encapsulates the data and functionality for the in memory representation of a tweet.
 * The class is lazily initialized on various data accesses as the full construction of this object includes some CPU intensive tasks.
 */
export class Tweet {
  private _init: boolean;

  /**
   * All constructor values bust be optional for the {@link Tweet#populate} method.
   * @param _id the tweet id as defined by Twitter
   * @param _html the html text used tio stub the tweet before the Twitter scripts are called.
   * @param _internalDateString this is a date string in the format supplied by the live.json file.
   * @param _poly type of region map ({@link PolygonLayerShortName}) this is associated with.
   * @param _place the region that this tweet is associated with
   */
  constructor(private _id: string = null, private _html: string = null, private _internalDateString: string = null,
              private _poly: string = null, private _place: string = null) {
  }

  private _date: Date;

  public get date(): Date {
    this.lazyInit();
    return this._date;
  }

  private _year: string;

  public get year(): string {
    this.lazyInit();
    return this._year;
  }

  private _month: string;

  public get month(): string {
    this.lazyInit();
    return this._month;
  }

  private _day: string;

  public get day(): string {
    this.lazyInit();
    return this._day;
  }

  private _hour: string;

  public get hour(): string {
    this.lazyInit();
    return this._hour;
  }

  private _sender: string;

  public get sender(): string {
    this.lazyInit();
    return this._sender;
  }

  private _url: string;

  public get url(): string {
    this.lazyInit();
    return this._url;
  }

  private _valid: boolean;

  public get valid(): boolean {
    this.lazyInit();
    return this._valid;
  }

  public get id(): string {
    return this._id;
  }

  get html(): string {
    return this._html;
  }

  get poly(): string {
    return this._poly;
  }

  get place(): string {
    return this._place;
  }

  /**
   * Populate this tweet from data from a Tweet like structure.
   * Primarily used to copy a deserialized Tweet which is not a
   * class but a Tweet like class.
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

  public asCSV(regionMap: any, sanitize: boolean, annotations: any = {}): CSVExportTweet {
    let impact = "";
    if (annotations.impact) {
      impact = annotations.impact;
    }
    this.lazyInit();
    if (sanitize) {
      return new CSVExportTweet(regionMap[this._place], this._id, this._date.toUTCString(),
                                "https://twitter.com/username_removed/status/" + this._id,
                                this.sanitizeForGDPR($("<div>").html(this._html).text()), impact);

    } else {
      return new CSVExportTweet(regionMap[this._place], this._id, this._date.toUTCString(), this._url,
                                $("<div>").html(this._html).text(), impact);
    }
  }

  sanitizeForGDPR(tweetText: string): string {
    // — Tim Hopkins (@thop1988)
    return tweetText
      .replace(/@[a-zA-Z0-9_-]+/g, "@USERNAME_REMOVED")
      .replace(/— .+ \(@USERNAME_REMOVED\).*$/g, "");
  }

  /**
   * Perform lazy initializing of the class.
   * This is called when various accessors need to access
   * fields that are computationally expensive to populate.
   */
  private lazyInit() {
    if (!this._init) {

      const regex = /.*<a href="https:\/\/twitter.com\/(\w+)\/status\/(\d+).*">.*<\/a><\/blockquote>/;
      const matched = this._html.match(regex);
      this._valid = (matched != null);
      if (matched) {
        this._sender = matched[1];
        console.assert(this._id === matched[2]);
        this._url = "https://twitter.com/" + this._sender + "/status/" + this._id;
      }
      this._date = new Date(Date.UTC(Number(this._internalDateString.substring(0, 4)),
                                     Number(this._internalDateString.substring(4, 6)) - 1,
                                     Number(this._internalDateString.substring(6, 8)),
                                     Number(this._internalDateString.substring(8, 10)),
                                     +Number(this._internalDateString.substring(10, 12)), 0, 0));

      this._year = new Intl.DateTimeFormat(environment.locale,
                                           {year: "2-digit", timeZone: environment.timezone}).format(this._date);
      this._month = new Intl.DateTimeFormat(environment.locale,
                                            {month: "short", timeZone: environment.timezone}).format(this._date);
      this._day = new Intl.DateTimeFormat(environment.locale, {day: "2-digit", timeZone: environment.timezone}).format(
        this._date);
      this._hour = new Intl.DateTimeFormat(environment.locale,
                                           {hour: "2-digit", hour12: true, timeZone: environment.timezone}).format(
        this._date);
      this._init = true;
    }
  }
}


