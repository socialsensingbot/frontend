import {environment} from "../../../environments/environment";
import * as geojson from "geojson";

export class CSVExportTweet {
    constructor(public region: string, public impact: string = "", public source: string = "", public id: string, public date: string,
                public url: string, public text: string, public location: string) {

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
     * @param _json the original JSON of the tweet.
     * @param _location the location associated with the tweet as determined by the backend process.
     * @param _date the timestamp associated with the tweet.
     * @param _region the region associated with this tweet
     */
    constructor(private _id: string = null, private _html: string = null, private _json: any = {}, private _location: geojson.GeoJsonObject,
                private _date: Date, private _region: string) {
    }


    get json(): any {
        return this._json;
    }

    get location(): geojson.GeometryCollection {
        return this._location as geojson.GeometryCollection;
    }

    get region(): string {
        return this._region;
    }

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

    public get html(): string {
        return this._html;
    }

    public get text(): string {
        this.lazyInit();
        return $(this.html).find("p")[0].innerHTML;
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
        let source = "";
        if (annotations.source) {
            source = annotations.source;
        }
        this.lazyInit();
        if (sanitize) {
            return new CSVExportTweet(regionMap[this._region], impact, source, this._id, this._date.toUTCString(),
                                      "https://twitter.com/username_removed/status/" + this._id,
                                      this.sanitizeForGDPR($("<div>").html(this._html).text()), JSON.stringify(this._location));

        } else {
            return new CSVExportTweet(regionMap[this._region], impact, source, this._id, this._date.toUTCString(), this._url,
                                      $("<div>").html(this._html).text(), JSON.stringify(this._location));
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
            this._sender = this._json.user.screen_name;
            if (this._html !== null) {
                this._valid = true;
            }
            this._url = "https://twitter.com/" + this._sender + "/status/" + this._id;

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
