import {environment} from "../../../environments/environment";
import * as geojson from "geojson";
import {blacklist, greylist} from "../../public-display/keywords";

const twitterLink = require("twitter-text");

export interface TweetCriteria {
    layerGroup: string;
    regionType: string;
    regionNames: string[];
    min: number;
    max: number;
}

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
    private _url_count: number;

    public get url_count(): number {
        return this._url_count;
    }

    private _hashtag_count: number;

    public get hashtag_count(): number {
        return this._hashtag_count;
    }

    private _mention_count: any;

    public get mention_count(): any {
        return this._mention_count;
    }

    public get verified(): boolean {
        return this._verified;
    }


    public get friends_count(): number {
        return this._friends_count;
    }


    public get followers_count(): any {
        return this._followers_count;
    }

    public get mediaCount(): number {
        this.lazyInit();
        const mediaEntities = this._entities.media;
        if (mediaEntities) {
            return mediaEntities.length;
        } else {
            return 0;
        }
    }

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

    get possibly_sensitive(): boolean {
        return this._possibly_sensitive;
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

    get retweet_count(): number {
        return this._retweet_count;
    }

    get profile_image_url(): string {
        return this._profile_image_url;
    }

    get screen_name(): string {
        return this._screen_name;
    }

    get username(): string {
        return this._username;
    }

    public get sender(): string {
        return this.screen_name;
    }

    public get text(): string {
        return this._text;
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

    private get entities(): any {
        return this._entities;
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

    /**
     * All constructor values bust be optional for the {@link Tweet#populate} method.
     * @param _id the tweet id as defined by Twitter
     * @param _html the html text used tio stub the tweet before the Twitter scripts are called.
     * @param _location the location associated with the tweet as determined by the backend process.
     * @param _date the timestamp associated with the tweet.
     * @param _region the region associated with this tweet
     */
    constructor(private _id: string = null, private _html: string = null, private _location: geojson.GeoJsonObject, private _date: Date,
                private _region: string, private _possibly_sensitive = false, private _text: string, private _verified: boolean,
                private _friends_count: number,
                private _followers_count: number,
                private _retweet_count: number,
                private _entities: any,
                private _profile_image_url: string,
                private _screen_name: string,
                private _username: string
    ) {
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
            this._url = "https://twitter.com/" + this.screen_name + "/status/" + this._id;

            this._year = new Intl.DateTimeFormat(environment.locale,
                                                 {year: "2-digit", timeZone: environment.timezone}).format(this._date);
            this._month = new Intl.DateTimeFormat(environment.locale,
                                                  {month: "short", timeZone: environment.timezone}).format(this._date);
            this._day = new Intl.DateTimeFormat(environment.locale, {day: "2-digit", timeZone: environment.timezone}).format(
                this._date);
            this._hour = new Intl.DateTimeFormat(environment.locale,
                                                 {hour: "2-digit", hour12: true, timeZone: environment.timezone}).format(
                this._date);
            const text = this.text;
            if (this._entities) {
                let urlEntities: string[] = this._entities.urls;
                if (this._entities.media) {
                    urlEntities = [...urlEntities, ...this._entities.media]
                }
                this._html = "<p>" + twitterLink.default.autoLink(text, {urlEntities, targetBlank: true, title: false}) + "</p>";
                const mediaEntities = this._entities.media;
                this._media = typeof mediaEntities !== "undefined" ? mediaEntities : [];
                this._mention_count = this._entities?.user_mentions?.length || 0;
                this._hashtag_count = this._entities?.hashtags?.length || 0;
                this._url_count = this._entities?.urls?.length || 0;
            } else {
                this._html = "<p>" + twitterLink.default.autoLink(text, {urlEntities: [], targetBlank: true, title: false}) + "</p>";

            }
            this._tokens = this.text.replace(/https?:\/\/[^\s]+/g, "").toLowerCase().split(/[^#@a-zA-Z_’'\u00C0-\u024F\u1E00-\u1EFF]+/);
        }
        this._init = true;
    }
}
