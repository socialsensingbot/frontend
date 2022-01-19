import {Component, Input, NgZone, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {Tweet} from "../tweet";
import {PreferenceService} from "../../../pref/preference.service";
import {Logger} from "@aws-amplify/core";
import {Subscription} from "rxjs";
import {environment} from "../../../../environments/environment";
import {AnnotationService} from "../../../pref/annotation.service";
import {MatDialog} from "@angular/material/dialog";
import {MatMenuTrigger} from "@angular/material/menu";

const twitterLink = require("twitter-text")

const log = new Logger("pd-tweet-list");
let loadTweets = false;

/**
 * The TweetListComponent is responsible for managing an invisibly
 * paged infinite scroll collection of tweets. At present all
 * tweets are stored in memory but their rendering is scrolled for browser performance.
 */
@Component({
               selector:    "app-pd-tweet-list",
               templateUrl: "./public-display-tweet-list.component.html",
               styleUrls:   ["./public-display-tweet-list.component.scss"]
           })
export class PublicDisplayTweetListComponent implements OnInit, OnDestroy {

    @Input()
    public annotationTypes: any[] = [];

    public loaded: boolean[] = [];
    public tweetCount = 0;
    public ready: boolean;
    public utc: boolean = environment.timezone === "UTC";
    @ViewChild("appMenu") menuTrigger: MatMenuTrigger;
    private _destroyed = false;
    private annotations: { [key: string]: any } = {};
    private _annotationSubscription: any;
    private _annotationRemovalSubscription: Subscription;

    private _tweets: Tweet[] | null = [];

    public get tweets(): Tweet[] {
        return this._tweets;
    }

    /**
     * The tweets to render or null if not yet ready.
     *
     * @param val the tweets or null
     */
    @Input()
    public set tweets(val: Tweet[] | null) {
        if (val === null) {
            // this.ready = false;
            this._tweets = [];
            this.ready = false;
            this.tweetCount = 0;
            log.debug("Tweets reset");
            return;
        }
        this.updateTweets(val);

    }

    constructor(private _zone: NgZone, private _dialog: MatDialog, public pref: PreferenceService,
                public annotate: AnnotationService) {
    }

    public show($event: any) {
        log.debug($event);
    }

    public sender(tweet) {
        return tweet.sender;
    }

    public isPlaceholder(tweet) {
        return !tweet.valid;
    }


    ngOnInit(): void {

    }

    public ngOnDestroy(): void {
        this._destroyed = true;

    }

    public isNewDate(i: number) {
        return i > 0 && this.tweets.length > i && this.tweets[i - 1].day !== this.tweets[i].day;
    }


    public isCached(id: string) {
        if (!localStorage.getItem("tweet:" + id)) {
            return false;

        }
        const item = JSON.parse(localStorage.getItem("tweet:" + id));

        if (item && item.timestamp > Date.now() - 60 * 50 * 1000) {
            return true;
        } else {
            return false;
        }
    }

    public cached(id: string) {
        log.debug("From cache " + id);
        return JSON.parse(localStorage.getItem("tweet:" + id)).html;
    }

    public annotationsFor(tweet: Tweet) {
        return this.annotations[tweet.id] || {};
    }

    public annotationValueFor(tweet: Tweet, key: string) {
        return (this.annotationsFor(tweet))[key];
    }

    public annotationValueIs(tweet: Tweet, key: string, value) {
        return (this.annotationValueFor(tweet, key)) === value;
    }

    public annotationValueIsNot(tweet: Tweet, key: string, value) {
        return !this.annotationValueIs(tweet, key, value);
    }

    public styleFor(type: string, tweet: Tweet) {
        const value = this.annotationValueFor(tweet, type);
        log.verbose("Annotation value is ", value);
        let filtered: any[] = this.annotationTypes.filter(i => i.name === type);
        log.verbose("Annotations filtered: ", filtered);
        for (const filteredElement of filtered) {
            for (const option of filteredElement.options) {
                if (option.value === value) {
                    log.verbose("Annotations selected ", option);
                    return "border-left: 3px solid " + option.color;
                }
            }
        }


        return "border-left: 3px solid transparent";

    }

    public styleForPhoto(media: any): any {
        const width: number = 23;
        const height = (width / media.sizes.small.w) * media.sizes.small.h;

        return {
            "object-fit": media.sizes.small.resize === "fit" ? "contain" : "cover",
            "width.vw":   width,
            "height.vw":  height
        };
    }

    public entities(tweet: any): any {
        const entities = tweet.json.extended_tweet ? tweet.json.extended_tweet.entities : tweet.json.entities;
        return typeof entities !== "undefined" ? entities : {};
    }

    public tweetHtml(tweet: any): any {
        const entities = tweet.json.extended_tweet ? tweet.json.extended_tweet.entities : tweet.json.entities;
        const text = tweet.json.extended_tweet ? tweet.json.extended_tweet.full_text : tweet.json.text;
        let urlEntities: string[] = entities.urls;
        if (entities.media) {
            urlEntities = [...urlEntities, ...entities.media]
        }
        return "<p>" + twitterLink.default.autoLink(text, {urlEntities, targetBlank: true, title: false}) + "</p>";
    }

    public mediaEntities(tweet: any): any[] {
        const mediaEntities = tweet.json.extended_tweet ? tweet.json.extended_tweet.entities.media : tweet.json.entities.media;
        return typeof mediaEntities !== "undefined" ? mediaEntities : [];
    }

    public videoVariant(media: any): any {
        for (const variant of media.video_info.variants) {
            if (variant.content_type === "video/mp4") {
                return variant;
            }
        }
        return null;
    }

    /**
     * Update the tweets stored in this list.
     * @param val an array of {@link Tweet}s
     */
    private updateTweets(val: Tweet[]) {
        this.tweetCount = val.length;
        log.debug("updateTweets()");
        if (this._destroyed) {
            return;
        }
        let changed = false;
        if (val.length !== this._tweets.length) {
            changed = true;
        } else {
            for (let i = 0; i < val.length; i++) {
                if (this._tweets[i].id !== val[i].id) {
                    changed = true;
                }

            }
        }
        if (!changed) {
            log.debug("No change, returning from updateTweets()");
            this.ready = true;
            return;
        }

        if (val.length !== this._tweets.length) {
            this._tweets.length = val.length;
        }
        if (this.loaded.length !== val.length) {
            this.loaded.length = val.length;
        }

        for (let i = 0; i < val.length; i++) {

            const tweet = val[i];

            this._tweets[i] = tweet;
            if (tweet.valid) {
                this.annotate.getAnnotations(tweet).then(tweetAnnotationRecord => {
                    if (tweetAnnotationRecord && tweetAnnotationRecord.annotations && tweetAnnotationRecord.annotations[0] !== "u") {
                        log.debug("Annotation record for tweet was ", tweetAnnotationRecord.annotations);
                        this.annotations[tweet.id] = tweetAnnotationRecord.annotations;
                    } else {
                        this.annotations[tweet.id] = {};
                    }
                });
            }
            if (this._tweets[i] && this._tweets[i].id !== tweet.id) {
                this._tweets[i] = tweet;
            }
        }
        log.debug(this.annotations);
        log.debug(this.tweets);

        this.pref.waitUntilReady().then(i => this.ready = true);
    }


}
