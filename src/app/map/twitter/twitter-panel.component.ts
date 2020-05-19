import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as $ from "jquery";
import {PreferenceService} from "../../pref/preference.service";
import {Hub, Logger} from "aws-amplify";
import {Tweet} from "./tweet";
import {IInfiniteScrollEvent} from "ngx-infinite-scroll";

const log = new Logger('twitter-panel');

let twitterBound = false;

function twitterLoad(page: number) {
  //todo: the use of setTimeout is very brittle, revisit.
  if ((window as any).twttr && (window as any).twttr.widgets) {
    setTimeout(() => {
      (window as any).twttr.widgets.load($(".tweet-page-" + page)[0]);
    }, 50);
  } else {
    setTimeout(() => twitterLoad(page), 500);
  }

}

function twitterInit() {
  if ((window as any).twttr && (window as any).twttr.events) {
    (window as any).twttr.events.bind(
      'rendered',
      (event) => {
        log.debug(event);
        twitterBound = true;
        Hub.dispatch("twitter-panel", {message: "render", event: "render", data: event.target});

        window.setTimeout(() => {
          const parent = $(event.target).parent();
          if (parent.find("blockquote.twitter-tweet-error").length > 0) {
            parent.parent().find(".app-twitter-item-menu").hide();
            parent.find("blockquote.twitter-tweet-error")
                  .parent()
                  .parent()
                  .parent()
                  .text("Tweet no longer available")
                  .css("opacity", 1.0)
                  .css("min-width", "516px")
                  .css("text-align", "center");
          }
          try {
            event.target.parentNode.parentNode.parentNode.parentNode.style.opacity = 1.0;
            event.target.parentNode.parentNode.parentNode.parentNode.style.maxHeight = "100%";
          } catch (e) {
            log.debug(e);
          }
        }, 100);

      }
    );
  } else {
    setTimeout(() => twitterInit(), 500);
  }
}

twitterInit();


class TweetPage {

  constructor(public page: number, public start: number, public tweets: Tweet[]) {}
}

@Component({
             selector:    'twitter-panel',
             templateUrl: './twitter-panel.component.html',
             styleUrls:   ['./twitter-panel.component.scss']
           })
export class TwitterPanelComponent implements OnChanges, OnDestroy, OnInit {


  @ViewChild("tinfoEmbeds", {read: ElementRef, static: false}) tinfoEmbeds: ElementRef;
  @Input() count: number;
  @Input() region: string;
  @Input() exceedanceProbability: string;
  private _tweets: Tweet[] | null = null;
  public hidden: boolean[] = [];
  public loaded: boolean[] = [];
  public tweetCount = 0;
  public visibleCount = 0;
  public ready: boolean;
  private _destroyed: boolean = false;

  // Infinite scroll start: https://github.com/socialsensingbot/frontend/issues/10
  private readonly PAGE_SIZE = 20;
  private readonly INITIAL_PAGES = 3;
  public scrollDistance = 4;
  public scrollUpDistance = 4;
  public throttle = 300;
  public direction: string;
  public maxPage = this.INITIAL_PAGES;
  public minPage = 0;

  // Infinite scroll end

  @Input() showHeaderInfo: boolean = true;
  @Input() showTimeline: boolean;
  public moreToShow: boolean;
  public pages: TweetPage[] = [];

  constructor(private _zone: NgZone, public pref: PreferenceService) {
    // Hub.listen("twitter-panel", (e) => {
    //   if (e.payload.message === "update") {
    //     this._zone.run(() => this.updateTweets());
    //   }
    // });
    Hub.listen("twitter-panel", (e) => {
      if (e.payload.message === "render") {
        this._zone.run(() => this.ready = true);
      }
    });
    Hub.listen("twitter-panel", (e) => {
      if (e.payload.message === "refresh") {
        this._zone.run(() => this.updateTweets(this._tweets));
      }
    });

  }

  @Input()
  public set tweets(val: Tweet[] | null) {
    if (val === null) {
      // this.ready = false;
      this._tweets = [];
      this.ready = false;
      this.tweetCount = 0;
      console.log("Tweets reset");
      return;
    }

    this.updateTweets(val);

  }

  private updateTweets(val: Tweet[]) {
    this.tweetCount = val.length;
    log.debug("updateTweets()");
    if (this._destroyed) {
      return;
    }
    let changed = false;
    if (val.length != this._tweets.length) {
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
      this.pages.length = Math.ceil(val.length / this.PAGE_SIZE)
    }
    if (val.length !== this._tweets.length) {
      this._tweets.length = val.length;
    }
    if (this.hidden.length !== val.length) {
      this.hidden.length = val.length;
    }
    if (this.loaded.length !== val.length) {
      this.loaded.length = val.length;
    }
    for (let i = 0; i < val.length; i++) {
      const page = Math.floor(i / this.PAGE_SIZE);
      const tweetOnPage = i % this.PAGE_SIZE;
      if (tweetOnPage === 0) {
        this.pages[page] = new TweetPage(page, i, []);
      }
      const tweet = val[i];
      if (tweetOnPage >= this.pages[page].tweets.length) {
        this.pages[page].tweets.push(tweet)
      } else {
        this.pages[page].tweets[i] = tweet;

      }


      this._tweets[i] = tweet;
      if (this._tweets[i] && this._tweets[i].id !== tweet.id) {
        this._tweets[i] = tweet;
      }
      this.hidden[i] = this.pref.isBlacklisted(tweet);
    }


    log.debug(this.tweets);
    this.visibleCount = this.hidden.filter(i => !i).length;
    if (this.visibleCount > 0) {
      log.debug("Waiting for tweets to load before marking as ready.");
      this.ready = true;
    } else {
      log.debug("No tweets to load so marking as ready.");
      this.ready = true;
    }
    for (let i = this.minPage; i <= this.maxPage; i++) {
      this.animateTweetAppearance(i);
    }
    this.moreToShow = this.maxPage < this.pages.length;
  }

  public get tweets(): Tweet[] {
    return this._tweets;
  }


  private animateTweetAppearance(page: number) {
    if (typeof this.loaded[page] === undefined) {
      this.loaded[page] = false;
    }
    console.log("Loading tweets by page " + page);
    if (!this.loaded[page]) {
      twitterLoad(page);
    }
  }

  private appearTweet(i: number) {
    if (!this.loaded[i]) {
      if ($(".atr-" + i + " blockquote").has("a")) {
        log.debug("Loading tweet " + i);
        twitterLoad(i);
        this.loaded[i] = true;
      } else {
        log.debug("Skipping " + i);
      }
    }
  }

  public show($event: any) {
    log.debug($event);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    log.debug(changes);
    // (window as any).twttr.widgets.load($("#tinfo")[0]);
  }

  public removeTweet(tweet, $event: MouseEvent) {
    this.showHide();
  }

  private showHide() {


    for (let j = 0; j < this.tweets.length; j++) {
      const blacklisted = this.pref.isBlacklisted(this.tweets[j]);
      if (blacklisted != this.hidden[j]) {
        twitterLoad(j);
        this.hidden[j] = blacklisted;
      }
    }
    this.visibleCount = this.hidden.filter(i => !i).length;
  }

  public sender(tweet) {

    return tweet.sender;

  }

  public isPlaceholder(tweet) {
    return !tweet.valid;
  }


  public showTweet(tweet, $event: MouseEvent) {
    this.showHide();
  }

  public async ignoreSender(tweet, $event: MouseEvent) {
    await this.pref.ignoreSender(tweet);
    this.removeTweet(tweet, $event)
  }

  public async unIgnoreSender(tweet, $event: MouseEvent) {
    await this.pref.unIgnoreSender(tweet);
    this.showTweet(tweet, $event)
  }

  public async ignoreTweet(tweet, $event: MouseEvent) {
    await this.pref.ignoreTweet(tweet);
    this.removeTweet(tweet, $event)
  }

  public async unIgnoreTweet(tweet, $event: MouseEvent) {
    await this.pref.unIgnoreTweet(tweet);
    this.showTweet(tweet, $event)
  }

  ngOnInit(): void {
  }

  public ngOnDestroy(): void {
    this._destroyed = true;
  }

  public isNewDate(i: number) {
    return i > 0 && this.tweets[i - 1].day !== this.tweets[i].day;
  }


  onScrollDown(ev) {
    console.log('scrolled down!!', ev);
    //add items
    this.direction = 'down'
    const oldMax = this.maxPage;
    if (this.maxPage < this.pages.length - 1) {
      this.moreToShow = true;
      this.maxPage += 1;
    } else {
      this.moreToShow = false;
      this.maxPage = this.pages.length - 1
    }
    if (this.minPage < this.pages.length - this.INITIAL_PAGES - 1) {
      this.minPage += 1;
    } else {
      this.minPage = Math.max(this.pages.length - this.INITIAL_PAGES - 1, 0);
    }
    log.debug(this.maxPage);
    if (oldMax != this.maxPage) {
      this.animateTweetAppearance(oldMax);
    }
    console.log("New max page " + this.maxPage)
    console.log("New min page " + this.minPage)
  }

  onUp($event: IInfiniteScrollEvent) {
    console.log('scrolled up!', $event);

    this.direction = 'up';
    const oldMin = this.minPage;
    if ($event.currentScrollPosition == 0) {
      this.maxPage = this.INITIAL_PAGES;
      this.minPage = 0;
    }
    if (this.maxPage > this.INITIAL_PAGES) {
      this.maxPage -= 1;

    }
    if (this.minPage > 0) {
      this.minPage -= 1;
    }
    if (oldMin != this.minPage) {
      this.animateTweetAppearance(this.minPage);
    }
    console.log("New max page " + this.maxPage)
    console.log("New min page " + this.minPage)

    // if (this.maxTweets > 100) {
    //   this.maxTweets -= this.PAGE_SIZE;
    // }
  }
}
