import {Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {Tweet} from "../tweet";
import {PreferenceService} from "../../../pref/preference.service";
import {Hub, Logger} from "@aws-amplify/core";
import * as $ from "jquery";
import {IInfiniteScrollEvent} from "ngx-infinite-scroll";
import {Subscription, timer} from "rxjs";
import {environment} from "../../../../environments/environment";
import {AnnotationService} from "../../../pref/annotation.service";
import {MatDialog} from "@angular/material/dialog";
import {MatMenuTrigger} from "@angular/material/menu";
import {TweetCopyDialogComponent} from "./tweet-copy-dialog/tweet-copy-dialog.component";

const log = new Logger("tweet-list");
let loadTweets = false;

setInterval(() => {
  // todo: the use of setTimeout is very brittle, revisit.
  if ((window as any).twttr && (window as any).twttr.widgets) {
    (window as any).twttr.widgets.load($("app-tweet-list")[0]);
  }

}, 1000);

let twitterBound = false;

function twitterInit() {
  if ((window as any).twttr && (window as any).twttr.events) {
    (window as any).twttr.events.bind(
      "rendered",
      (event) => {
        log.debug(event);
        twitterBound = true;
        loadTweets = false;
        $(event.target).parents(".app-tweet-page").addClass("app-tweet-page-loaded");
        Hub.dispatch("twitter-panel", {message: "render", event: "render", data: event.target});
        const parent = $(event.target).parent();
        const atr = $(event.target).parents(".app-tweet-row");

        const blockquote = atr.find("blockquote");
        blockquote.addClass("tweet-rendered");
        window.setTimeout(() => {
          atr.addClass("app-tweet-row-animate-in");
          atr.removeClass("app-tweet-row-animate-out");
          setTimeout(() => {
            atr.addClass("app-tweet-row-rendered");
            atr.removeClass("app-tweet-row-animate-in");
            if (atr[0]) {
              localStorage.setItem("tweet:" + atr.attr("data-tweet-id"),
                                   JSON.stringify(
                                     {timestamp: Date.now(), html: atr.find(".app-tweet-item-text").html()}));
            }
          }, 800);
          if (atr.find("blockquote.twitter-tweet-error").length > 0) {
            const error = atr.find("blockquote.twitter-tweet-error");
            error.find(".app-tweet-item-menu").hide();


            error.css("opacity", 1.0)
                 .css("min-width", "516px")
                 .css("display", "block")
                 .css("text-align", "center");
            error.parent().addClass("app-tweet-item-card");

            error.text("Tweet no longer available");
            blockquote.removeClass("tweet-rendered");
          }
          try {
            if (atr.length > 0) {
              atr.find("mat-spinner").css("opacity", 0);
              atr.find(".app-tweet-item-menu").css("opacity", 1.0);
              // atr.find(".tweet-loading-placeholder").remove();
            }
          } catch (e) {
            log.debug(e);
          }
        }, 10);

      }
    );
  } else {
    setTimeout(() => twitterInit(), 500);
  }
}

twitterInit();


class TweetPage {
  public loaded = false;

  constructor(public page: number, public start: number, public tweets: Tweet[]) {}

  public is(other: TweetPage) {
    return other.page === this.page
      && other.start === this.start
      && this.tweets.length === other.tweets.length
      && this.tweets.every((tweet, i) => this.tweets[i].id === other.tweets[i].id);
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
  public ready: boolean;
  public scrollDistance = 4;
  public scrollUpDistance = 4;
  public throttle = 300;
  public direction: string;
  public minPage = 0;
  public moreToShow: boolean;
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
  private readonly PAGE_SIZE = 5;
  private readonly INITIAL_PAGES = 3;
  public maxPage = this.INITIAL_PAGES - 1;
  private lastDateShow: number;
  private _dateHeaderTimer: Subscription;
  private annotations: { [key: string]: any } = {};
  private _annotationSubscription: any;
  private _annotationRemovalSubscription: Subscription;

  constructor(private _zone: NgZone, private _dialog: MatDialog, public pref: PreferenceService,
              public annotate: AnnotationService) {}

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
  }

  public async unIgnoreSender(tweet, $event: MouseEvent) {
    await this.pref.groupUnIgnoreSender(tweet);
    this.update.emit(tweet);
  }

  public async ignoreTweet(tweet, $event: MouseEvent) {
    await this.pref.groupIgnoreTweet(tweet);
    this.update.emit(tweet);
  }

  public async unIgnoreTweet(tweet, $event: MouseEvent) {
    await this.pref.groupUnIgnoreTweet(tweet);
    this.update.emit(tweet);
  }

  public async annotateTweet(tweet, annotations, $event: MouseEvent) {
    // This is a simple optimization, that changes our local version of the annotations first
    // we then get the authoritative version from the server
    this.annotations[tweet.id] = {...this.annotationsFor(tweet), ...annotations};
    const groupTweetAnnotations = await this.annotate.addAnnotations(tweet, annotations);
    this.annotations[tweet.id] = JSON.parse(groupTweetAnnotations.annotations);
    this.update.emit(tweet);
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
    });
    this._annotationRemovalSubscription = this.annotate.tweetAnnotationsRemoved.subscribe(
      groupTweetAnnotations => delete this.annotations[groupTweetAnnotations.tweetId]);
    this._annotationSubscription = this.annotate.tweetAnnotated.subscribe(groupTweetAnnotations => {
      if (groupTweetAnnotations.annotations) {
        log.info("Received new annotation record of ", groupTweetAnnotations);
        this.annotations[groupTweetAnnotations.tweetId] = JSON.parse(groupTweetAnnotations.annotations);
      }
    });
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

  public isNewDate(i: number) {
    return i > 0 && this.tweets.length > i && this.tweets[i - 1].day !== this.tweets[i].day;
  }

  onScrollDown(ev) {
    log.debug("scrolled down!!", ev);
    // add items
    this.direction = "down";
    const oldMax = this.maxPage;
    if (this.maxPage < this.pages.length - 1) {
      this.moreToShow = true;
      this.maxPage += 1;
    } else {
      this.moreToShow = false;
      this.maxPage = this.pages.length - 1;
    }
    if (this.minPage <= this.pages.length - this.INITIAL_PAGES) {
      this.minPage += 1;
    } else {
      this.minPage = Math.max(this.pages.length - this.INITIAL_PAGES, 0);
    }
    log.debug(this.maxPage);
    if (oldMax !== this.maxPage) {
      this.loadPagesOfTweets();
    }
    log.debug("New max page " + this.maxPage);
    log.debug("New min page " + this.minPage);
  }

  onUp($event: IInfiniteScrollEvent) {
    log.debug("scrolled up!", $event);

    this.direction = "up";
    const oldMin = this.minPage;
    if ($event.currentScrollPosition === 0) {
      this.maxPage = this.INITIAL_PAGES - 1;
      this.minPage = 0;
    }
    if (this.maxPage >= this.INITIAL_PAGES) {
      this.maxPage -= 1;

    }
    if (this.minPage > 0) {
      this.minPage -= 1;
    }
    if (oldMin !== this.minPage) {
      this.loadPagesOfTweets();
    }
    log.debug("New max page " + this.maxPage);
    log.debug("New min page " + this.minPage);

    // if (this.maxTweets > 100) {
    //   this.maxTweets -= this.PAGE_SIZE;
    // }
  }

  public calcFirstVisibleDate() {
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
      this.firstVisibleDate = this.tweets[i].date;
      this.showDateHeader = true;
      this.lastDateShow = Date.now();
    }
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

  public styleForImpact(tweet: Tweet) {
    const impactValue = this.annotationValueFor(tweet, "impact");
    for (const level of this.pref.combined.impact.levels) {
      if (level.value === impactValue) {
        return "border-left-color:" + level.color;
      }
    }
    return "border-left-color:rgba(0,0,0,0.0)";

  }

  public copy(tweet: Tweet, $event: MouseEvent) {
    const dialogRef = this._dialog.open(TweetCopyDialogComponent, {data: {tweet}});
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
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

    if (this.pages.length !== Math.ceil(val.length / this.PAGE_SIZE)) {
      this.pages.length = Math.ceil(val.length / this.PAGE_SIZE);
    }
    if (val.length !== this._tweets.length) {
      this._tweets.length = val.length;
    }
    if (this.loaded.length !== val.length) {
      this.loaded.length = val.length;
    }
    let currPage = new TweetPage(0, 0, []);
    this.pages.length = Math.ceil(val.length / this.PAGE_SIZE);
    for (let i = 0; i < val.length; i++) {
      const page = Math.floor(i / this.PAGE_SIZE);
      const tweetOnPage = i % this.PAGE_SIZE;
      if (this.isCached(val[i].id)) {
        this.cache[val[i].id] = this.cached(val[i].id);
      }
      if (tweetOnPage === 0) {
        currPage = new TweetPage(page, i, []);
      }
      const tweet = val[i];
      if (tweetOnPage >= currPage.tweets.length) {
        currPage.tweets.push(tweet);
      } else {
        currPage.tweets[tweetOnPage] = tweet;
      }

      const lastEntryOnPage = i === (val.length - 1) || ((i + 1) % this.PAGE_SIZE) === 0;
      if (lastEntryOnPage) {
        // Do not change/reload unchanged pages.
        if (typeof this.pages[page] === "undefined" || !this.pages[page].is(currPage)) {
          log.debug(`Pages are different for page ${page}: `, this.pages[page], currPage);
          this.pages[page] = currPage;
        }
      }

      this._tweets[i] = tweet;
      if (tweet.valid) {
        this.annotate.getAnnotations(tweet).then(tweetAnnotationRecord => {
          if (tweetAnnotationRecord && tweetAnnotationRecord.annotations && tweetAnnotationRecord.annotations[0] !== "u") {
            this.annotations[tweet.id] = JSON.parse(tweetAnnotationRecord.annotations);
          } else {
            this.annotations[tweet.id] = {};
          }
        });
      }
      if (this._tweets[i] && this._tweets[i].id !== tweet.id) {
        this._tweets[i] = tweet;
      }
    }
    log.warn(this.annotations);


    log.debug(this.tweets);
    this.loadPagesOfTweets();
    this.moreToShow = this.maxPage < this.pages.length;
    this.pref.waitUntilReady().then(i => this.ready = true);
  }

  private loadPagesOfTweets() {
    for (let i = 0; i <= this.maxPage; i++) {
      this.animateTweetAppearance(i);
    }
  }

  private async animateTweetAppearance(page: number) {
    if (this.pages[page] && !this.pages[page].loaded) {
      log.debug("Loading tweets by page " + page);
      loadTweets = true;
      this.pages[page].loaded = true;
    }
  }
}


