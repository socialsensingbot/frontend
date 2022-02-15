import {environment} from "../../../environments/environment";
import * as geojson from "geojson";
import {blacklist, greylist} from "../../public-display/keywords";

const twitterLink = require("twitter-text");

export interface CSVExportTweet {
    region: string;
    impact: string;
    id: string;
    date: string;
    url: string;
    text: string;
    location: string;
    source?: string;

}


/**
 * This class encapsulates the data and functionality for the in memory representation of a tweet.
 * The class is lazily initialized on various data accesses as the full construction of this object includes some CPU intensive tasks.
 */
export class Tweet {

    private _media: any[];

    private _mediaCount: number;


    private _init: boolean;
    private _tokens: string[];

    public get media(): any[] {
        this.lazyInit();
        return this._media;
    }

    public get tokens(): string[] {
        this.lazyInit();
        return this._tokens;
    }

    public get mediaCount(): number {
        this.lazyInit();
        const mediaEntities = this.json.extended_tweet ? this.json.extended_tweet.entities.media : this.json.entities.media;
        if (mediaEntities) {
            return mediaEntities.length;
        } else {
            return 0;
        }
    }

    public get greylisted(): boolean {
        this.lazyInit();
        return greylist.some(v => this.tokens.includes(v))
    }

    public get blacklisted(): boolean {
        this.lazyInit();
        return blacklist.some(v => this.tokens.includes(v))
    }

    get potentiallySensitive(): boolean {
        this.lazyInit();
        return this._possibly_sensitive;
    }


    get html(): string {
        this.lazyInit();
        return this._html;
    }

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
                private _date: Date, private _region: string, private _possibly_sensitive = false) {
    }

    public get json(): any {
        if (typeof this._json === "string") {
            this._json = JSON.parse(this._json);
        }
        return this._json;
    }

    public get location(): geojson.GeometryCollection {
        return this._location as geojson.GeometryCollection;
    }

    public get region(): string {
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

    private _valid: boolean = true;

    public get valid(): boolean {
        this.lazyInit();
        return this._valid;
    }

    public get id(): string {
        return this._id;
    }

    public get text(): string {
        return this.json.extended_tweet ? this.json.extended_tweet.full_text : this.json.text;
    }


    public get oldText(): string {
        this.lazyInit();
        const paragraphElement: HTMLParagraphElement = $(this.text).find("p")[0];
        if (paragraphElement) {
            return paragraphElement.innerHTML;
        } else {
            return "<h3>This tweet's text is no longer available.</h3>";
        }
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
        this._possibly_sensitive = tweet._possibly_sensitive;
        return this;
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
    public lazyInit() {
        if (!this._init) {
            this._tokens = this.text.replace(/https?:\/\/[^\s]+/g, "").toLowerCase().split(/[^#@a-zA-Z_’'\u00C0-\u024F\u1E00-\u1EFF]+/);
            this._sender = this.json.user.screen_name;
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
            const entities = this.json.extended_tweet ? this.json.extended_tweet.entities : this.json.entities;
            const text = this.text;
            let urlEntities: string[] = entities.urls;
            if (entities.media) {
                urlEntities = [...urlEntities, ...entities.media]
            }
            this._html = "<p>" + twitterLink.default.autoLink(text, {urlEntities, targetBlank: true, title: false}) + "</p>";
            const mediaEntities = this.json.extended_tweet ? this.json.extended_tweet.entities.media : this.json.entities.media;
            this._media = typeof mediaEntities !== "undefined" ? mediaEntities : [];
        }
        this._init = true;
    }
}
