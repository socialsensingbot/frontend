import {Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {Tweet, TweetCriteria} from "../tweet";
import {PreferenceService} from "../../../pref/preference.service";
import {Logger} from "@aws-amplify/core";
import * as $ from "jquery";
import {IInfiniteScrollEvent} from "ngx-infinite-scroll";
import {Subscription, timer} from "rxjs";
import {environment} from "../../../../environments/environment";
import {AnnotationService} from "../../../pref/annotation.service";
import {MatDialog} from "@angular/material/dialog";
import {MatMenuTrigger} from "@angular/material/menu";
import {TweetCopyDialogComponent} from "./tweet-copy-dialog/tweet-copy-dialog.component";
import {NotificationService} from "../../../services/notification.service";
import {RESTMapDataService} from "../../data/rest-map-data.service";

const twitterLink = require("twitter-text");

const log = new Logger("tweet-list");
let loadTweets = false;

class TweetPage {
    public loaded = false;

    constructor(public page: number, public tweets: Tweet[], public start = 0) {
    }

    public is(other: TweetPage) {
        return other.page === this.page
            && this.tweets.length === other.tweets.length
            && this.tweets.every((tweet, i) => this.tweets[i].id === other.tweets[i].id);
    }

    public firstDate(): Date {
        return this.tweets[0].date;
    }

    public isEmpty(): Boolean {
        return this.tweets.length === 0;
        "";
    }
}

/**
 * The TweetListComponent is responsible for managing an invisibly
 * paged infinite scroll collection of tweets. At present all
 * tweets are stored in memory but their rendering is scrolled for browser performance.
 */
@Component({
               selector:    "app-tweet-list",
               templateUrl: "./tweet-list.component.html",
               styleUrls:   ["./tweet-list.component.scss"]
           })
export class TweetListComponent implements OnInit, OnDestroy {


    public loaded: boolean[] = [];
    public tweetCount = 0;
    public ready = false;
    public scrollDistance = 4;
    public scrollUpDistance = 4;
    public throttle = 300;
    public direction: string;
    public minPage = 0;
    public moreToShow: boolean = true;
    public pages: TweetPage[] = [];
    /**
     * If the set of tweets have been updated (by an ignore/unignore for example) this will emit an event to the parent component.
     */
    @Output() public update: EventEmitter<Tweet> = new EventEmitter();
    /**
     * A name for this group of tweets presently only "hidden" or "visible" is allowed.
     */
    @Input() public group: "hidden" | "visible";
    public firstVisibleDate: Date;
    // Infinite Scroll End
    public showDateHeader: boolean;
    public utc: boolean = environment.timezone === "UTC";
    public cache: any = {};
    @ViewChild("appMenu") menuTrigger: MatMenuTrigger;
    private _destroyed = false;
    // Infinite scroll start: https://github.com/socialsensingbot/frontend/issues/10
    public readonly PAGE_SIZE = 10;
    private readonly INITIAL_PAGES = 3;
    public maxPage = this.INITIAL_PAGES - 1;
    private lastDateShow: number;
    private _dateHeaderTimer: Subscription;
    private annotations: { [key: string]: any } = {};
    private _annotationSubscription: any;
    private _annotationRemovalSubscription: Subscription;
    @Input()
    public ignored: any;

    private _criteria: TweetCriteria;

    public get criteria(): TweetCriteria {
        return this._criteria;
    }

    @Input()
    public set criteria(value: TweetCriteria) {
        if (JSON.stringify(value) !== JSON.stringify(this._criteria)) {
            this._criteria = value;
            // noinspection JSIgnoredPromiseFromCall
            if (this.ready) {
                this.reset();
            }
        }
    }

    @Input()
    public annotationTypes: any[] = [];

    constructor(private _zone: NgZone, private _dialog: MatDialog, public pref: PreferenceService,
                private _notify: NotificationService,
                public annotate: AnnotationService, public data: RESTMapDataService) {
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

    public async ignoreSender(tweet, $event: MouseEvent) {
        await this.pref.groupIgnoreSender(tweet);
        this.update.emit(tweet);
        await this.reset();
    }

    public async unIgnoreSender(tweet, $event: MouseEvent) {
        await this.pref.groupUnIgnoreSender(tweet);
        this.update.emit(tweet);
        await this.reset();
    }

    public async ignoreTweet(tweet, $event: MouseEvent) {
        await this.pref.groupIgnoreTweet(tweet);
        this.update.emit(tweet);
        await this.reset();
    }

    public async unIgnoreTweet(tweet, $event: MouseEvent) {
        await this.pref.groupUnIgnoreTweet(tweet);
        this.update.emit(tweet);
        await this.reset();
    }

    public async annotateTweet(tweet, annotations, $event: MouseEvent) {
        // This is a simple optimization, that changes our local version of the annotations first
        // we then get the authoritative version from the server
        const currAnnotations = this.annotations[tweet.id];
        try {
            this.annotations[tweet.id] = {...this.annotationsFor(tweet), ...annotations};
            const groupTweetAnnotations = await this.annotate.addAnnotations(tweet, annotations);
            this.annotations[tweet.id] = groupTweetAnnotations.annotations;
            log.info("Emitting ", tweet);
            this.update.emit(tweet);
            await this.reset();
        } catch (e) {
            this.annotations[tweet.id] = currAnnotations;
            this._notify.error(e);
        }
    }

    public async annotateTweetKeyValue(tweet, annotationKey, annotationValue, $event: MouseEvent) {
        const annotations = {};
        annotations[annotationKey] = annotationValue;
        await this.annotateTweet(tweet, annotations, $event);
    }

    public async removeTweetAnnotations(tweet, $event: MouseEvent) {
        await this.annotate.removeAllAnnotations(tweet);
        this.annotations[tweet.id] = {};
        this.update.emit(tweet);
    }

    ngOnInit(): void {
        this._dateHeaderTimer = timer(1000, 1000).subscribe(() => {
            if (Date.now() - this.lastDateShow > 1 * 1000) {
                this.showDateHeader = false;
            }
            if (this.minPage > 0) {
                //If the scroll position is at the top, you can't generate any more scroll up events. So we nudge it down a bit.
                if ($(".app-tweet-list").scrollTop() === 0) {
                    $(".app-tweet-list").scrollTop(100);
                }
            }
        });
        this._annotationRemovalSubscription = this.annotate.tweetAnnotationsRemoved.subscribe(
            groupTweetAnnotations => delete this.annotations[groupTweetAnnotations.tweetId]);
        this._annotationSubscription = this.annotate.tweetAnnotated.subscribe(groupTweetAnnotations => {
            if (groupTweetAnnotations.annotations) {
                log.info("Received new annotation record of ", groupTweetAnnotations);
                this.annotations[groupTweetAnnotations.tweetId] = groupTweetAnnotations.annotations;
            }
        });

        this.reset().then(() => this.ready = true);
    }

    public ngOnDestroy(): void {
        this._destroyed = true;
        this._dateHeaderTimer.unsubscribe();
        if (this._annotationSubscription) {
            this._annotationSubscription.unsubscribe();
            this._annotationSubscription = null;
        }
        if (this._annotationRemovalSubscription) {
            this._annotationRemovalSubscription.unsubscribe();
            this._annotationRemovalSubscription = null;
        }
    }

    // public isNewDate(i: number) {
    //     return i > 0 && this.tweets.length > i && this.tweets[i - 1].day !== this.tweets[i].day;
    // }

    async onScrollDown($event: IInfiniteScrollEvent) {
        log.debug("scrolled down!!", $event);
        this.direction = "down";

        log.debug(this.maxPage);
        await this.loadTweetPage(this.maxPage + 1).then(tweets => {
            log.debug(tweets);
            if (tweets.length === this.PAGE_SIZE) {
                this.moreToShow = true;
                this.maxPage += 1;
                this.minPage += 1;
                this.pages.shift();
                this.pages.push(new TweetPage(this.maxPage, tweets));
                log.debug(this.pages);
                log.debug("New max page " + this.maxPage);
                log.debug("New min page " + this.minPage);
            } else {
                this.moreToShow = false;
            }
            return tweets;
        }).then(
            tweets => {
            });

    }

    async onUp($event: IInfiniteScrollEvent) {
        log.debug("scrolled up!", $event);

        this.direction = "up";

        if (this.minPage > 0) {
            //If the scroll position is at the top, you can't generate any more scroll up events. So we nudge it down a bit.
            if ($event.currentScrollPosition === 0) {
                $(".app-tweet-list").scrollTop(100);
            }
            await this.loadTweetPage(this.minPage - 1).then(tweets => {
                if (this.maxPage >= this.INITIAL_PAGES) {
                    this.maxPage -= 1;
                    this.minPage -= 1;
                    this.moreToShow = true;
                } else {
                    this.moreToShow = false;
                    this.minPage = 0;
                }
                log.debug("New max page " + this.maxPage);
                log.debug("New min page " + this.minPage);
                return tweets;
            }).then(tweets => {
                this.pages.pop();
                this.pages.unshift(new TweetPage(this.minPage, tweets));
                log.debug(this.pages);
            });
        }

        // if (this.maxTweets > 100) {
        //   this.maxTweets -= this.PAGE_SIZE;
        // }
    }

    public calcFirstVisibleDate($event: IInfiniteScrollEvent) {
        const checkInView = (elem, partial) => {
            const container = $(".app-tweet-list");
            const contHeight = container.height();
            const contTop = container.scrollTop();
            const contBottom = contTop + contHeight;

            const elemTop = $(elem).offset().top - container.offset().top;
            const elemBottom = elemTop + $(elem).height();

            const isTotal = (elemTop >= 0 && elemBottom <= contHeight);
            const isPart = ((elemTop < 0 && elemBottom > 0) || (elemTop > 0 && elemTop <= container.height())) && partial;

            return isTotal || isPart;
        };

        let firstEl;

        for (const el of $(".app-tweet-row")) {
            if (checkInView(el, true)) {
                firstEl = $(el);
                break;
            }
        }
        if (firstEl) {
            const i = +firstEl.attr("data-index");
            this.firstVisibleDate = this.pages[0].firstDate();
            this.showDateHeader = true;
            this.lastDateShow = Date.now();
        }

    }

    public styleFor(type: string, tweet: Tweet) {
        const value = this.annotationValueFor(tweet, type);
        log.verbose("Annotation value is ", value);
        const filtered: any[] = this.annotationTypes.filter(i => i.name === type);
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

    public tweetHtml(tweet: Tweet): any {
        return tweet.html;
    }

    public copy(tweet: Tweet, $event: MouseEvent) {
        const dialogRef = this._dialog.open(TweetCopyDialogComponent, {data: {tweet}});
        dialogRef.afterClosed().subscribe(result => {
            log.debug(`Dialog result: ${result}`);
        });
    }

    public mediaEntities(tweet: Tweet): any[] {
        return tweet.media;
    }


    public styleForPhoto(media: any): any {
        const width: number = Math.min(media.sizes.small.w, 400);
        const height = (width / media.sizes.small.w) * media.sizes.small.h;

        return {
            "object-fit": media.sizes.small.resize === "fit" ? "contain" : "cover",
            "width.px":   width,
            "height.px":  height
        };
    }

    private async loadTweetPage(page: number): Promise<Tweet[]> {
        let tweetRequest: Promise<Tweet[]>;
        if (this.ignored) {
            tweetRequest = this.data.tweets(this._criteria.layerGroup, this._criteria.regionType, this._criteria.regionNames,
                                            this._criteria.min,
                                            this._criteria.max, page, this.PAGE_SIZE, "restrict", await this.pref.getTweetBlackList(),
                                            await this.pref.getTwitterUserBlackList());
        } else {
            tweetRequest = this.data.tweets(this._criteria.layerGroup, this._criteria.regionType, this._criteria.regionNames,
                                            this._criteria.min,
                                            this._criteria.max, page, this.PAGE_SIZE, "exclude", await this.pref.getTweetBlackList(),
                                            await this.pref.getTwitterUserBlackList())
                               .then(tweets => tweets.filter(i => !this.pref.isBlacklisted(i)));

        }
        return tweetRequest.then(value => {
            log.debug("Loaded page " + page, this._criteria, value);
            for (const tweet of value) {
                this.annotate.getAnnotations(tweet).then(tweetAnnotationRecord => {
                    if (tweetAnnotationRecord && tweetAnnotationRecord.annotations && tweetAnnotationRecord.annotations[0] !== "u") {
                        log.debug("Annotation record for tweet was ", tweetAnnotationRecord.annotations);
                        this.annotations[tweet.id] = tweetAnnotationRecord.annotations;
                    } else {
                        this.annotations[tweet.id] = {};
                    }
                });
            }
            return value;
        });
    }

    /**
     * Update the tweets stored in this list.
     * @param val an array of {@link Tweet}s
     */
    // private updateTweets(v: Tweet[]) {
    //     let newTweets = v;
    //     newTweets = getUniqueListBy(newTweets, "id") as Tweet[];
    //     this.tweetCount = newTweets.length;
    //     log.debug("updateTweets()");
    //     if (this._destroyed) {
    //         return;
    //     }
    //     let changed = false;
    //     if (newTweets.length !== this._tweets.length) {
    //         changed = true;
    //     } else {
    //         for (let i = 0; i < newTweets.length; i++) {
    //             if (!this._tweets[i]) {
    //             } else if (!newTweets[i]) {
    //                 log.warn("New tweets have a missing value at index " + i);
    //                 log.warn(newTweets);
    //                 changed = true;
    //             } else if (this._tweets[i].id !== newTweets[i].id) {
    //                 changed = true;
    //             }
    //
    //         }
    //     }
    //     if (!changed) {
    //         log.debug("No change, returning from updateTweets()");
    //         this.ready = true;
    //         return;
    //     }
    //
    //     if (this.pages.length !== Math.ceil(newTweets.length / this.PAGE_SIZE)) {
    //         this.pages.length = Math.ceil(newTweets.length / this.PAGE_SIZE);
    //     }
    //     if (newTweets.length !== this._tweets.length) {
    //         this._tweets.length = newTweets.length;
    //     }
    //     if (this.loaded.length !== newTweets.length) {
    //         this.loaded.length = newTweets.length;
    //     }
    //     let currPage = new TweetPage(0, 0, []);
    //     this.pages.length = Math.ceil(newTweets.length / this.PAGE_SIZE);
    //     for (let i = 0; i < newTweets.length; i++) {
    //         const page = Math.floor(i / this.PAGE_SIZE);
    //         const tweetOnPage = i % this.PAGE_SIZE;
    //         if (this.isCached(newTweets[i].id)) {
    //             this.cache[newTweets[i].id] = this.cached(newTweets[i].id);
    //         }
    //         if (tweetOnPage === 0) {
    //             currPage = new TweetPage(page, i, []);
    //         }
    //         const tweet = newTweets[i];
    //         if (tweetOnPage >= currPage.tweets.length) {
    //             currPage.tweets.push(tweet);
    //         } else {
    //             currPage.tweets[tweetOnPage] = tweet;
    //         }
    //
    //         const lastEntryOnPage = i === (newTweets.length - 1) || ((i + 1) % this.PAGE_SIZE) === 0;
    //         if (lastEntryOnPage) {
    //             // Do not change/reload unchanged pages.
    //             if (typeof this.pages[page] === "undefined" || !this.pages[page].is(currPage)) {
    //                 log.debug(`Pages are different for page ${page}: `, this.pages[page], currPage);
    //                 this.pages[page] = currPage;
    //             }
    //         }
    //
    //         this._tweets[i] = tweet;
    //         if (tweet.valid) {
    //             this.annotate.getAnnotations(tweet).then(tweetAnnotationRecord => {
    //                 if (tweetAnnotationRecord && tweetAnnotationRecord.annotations && tweetAnnotationRecord.annotations[0] !== "u") {
    //                     log.debug("Annotation record for tweet was ", tweetAnnotationRecord.annotations);
    //                     this.annotations[tweet.id] = tweetAnnotationRecord.annotations;
    //                 } else {
    //                     this.annotations[tweet.id] = {};
    //                 }
    //             });
    //         }
    //         if (this._tweets[i] && this._tweets[i].id !== tweet.id) {
    //             this._tweets[i] = tweet;
    //         }
    //     }
    //     log.warn(this.annotations);
    //
    //
    //     log.debug(this.tweets);
    //     this.loadPagesOfTweets();
    //     this.moreToShow = this.maxPage < this.pages.length;
    //     this.pref.waitUntilReady().then(i => this.ready = true);
    // }

    // private loadPagesOfTweets() {
    //     for (let i = 0; i <= this.maxPage; i++) {
    //         this.animateTweetAppearance(i);
    //     }
    // }

    private async animateTweetAppearance(page: number) {
        if (this.pages[page] && !this.pages[page].loaded) {
            log.debug("Loading tweets by page " + page);
            loadTweets = true;
            this.pages[page].loaded = true;
        }
    }


    public videoVariant(media: any): any {
        for (const variant of media.video_info.variants) {
            if (variant.content_type === "video/mp4") {
                return variant;
            }
        }
        return null;
    }

    private async reset() {
        this.pages = [];
        this.minPage = 0;
        this.maxPage = 0;
        for (let page = 0; page < this.INITIAL_PAGES; page++) {
            await this.loadTweetPage(page).then((tweets) => {
                if (tweets.length > 0) {this.pages.push(new TweetPage(page, tweets))}
                return tweets;
            });
        }
        for (let page = 0; page < this.INITIAL_PAGES; page++) {
            if (this.pages[page] && !this.pages[page].isEmpty()) {
                this.maxPage = page;
            }
        }
        this.pages = this.pages.slice(0, this.maxPage + 1);
    }
}
