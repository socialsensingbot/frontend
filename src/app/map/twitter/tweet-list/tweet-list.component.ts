import {Component, EventEmitter, Input, NgZone, OnInit, Output, SimpleChanges} from '@angular/core';
import {Tweet} from "../tweet";
import {PreferenceService} from "../../../pref/preference.service";
import {Hub, Logger} from "aws-amplify";
import * as $ from "jquery";
import {IInfiniteScrollEvent} from "ngx-infinite-scroll";

const log = new Logger('tweet-list');


function twitterLoad(selector) {
  //todo: the use of setTimeout is very brittle, revisit.
  if ((window as any).twttr && (window as any).twttr.widgets) {
    setTimeout(() => {
      (window as any).twttr.widgets.load($(selector)[0]);
    }, 50);
  } else {
    setTimeout(() => twitterLoad(selector), 500);
  }

}

let twitterBound = false;

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
          const atr = $(event.target).parents(".app-twitter-row");
          const blockquote = atr.find("blockquote");
          if (atr.find("blockquote.twitter-tweet-error").length > 0) {
            const error = atr.find("blockquote.twitter-tweet-error");
            error.find(".app-twitter-item-menu").hide();


            error.css("opacity", 1.0)
                 .css("min-width", "516px")
                 .css("text-align", "center");


            error.text("Tweet no longer available");
          } else {
            blockquote.addClass("tweet-rendered");
          }
          try {
            if (atr.length > 0) {
              atr.find("mat-spinner").hide();
              atr.find(".app-twitter-item-menu").css("opacity", 1.0);
              atr.find(".tweet-loading-placeholder").remove();
            }
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
             selector:    'app-tweet-list',
             templateUrl: './tweet-list.component.html',
             styleUrls:   ['./tweet-list.component.scss']
           })
export class TweetListComponent implements OnInit {

  private _tweets: Tweet[] | null = [];
  public loaded: boolean[] = [];
  public tweetCount = 0;
  public ready: boolean;
  private _destroyed: boolean = false;

  // Infinite scroll start: https://github.com/socialsensingbot/frontend/issues/10
  private readonly PAGE_SIZE = 20;
  private readonly INITIAL_PAGES = 3;
  public scrollDistance = 4;
  public scrollUpDistance = 4;
  public throttle = 300;
  public direction: string;
  public maxPage = this.INITIAL_PAGES - 1;
  public minPage = 0;

  @Output() public update: EventEmitter<Tweet> = new EventEmitter();
  @Input() public group: string;

  // Infinite scroll end

  public moreToShow: boolean;
  public pages: TweetPage[] = [];

  constructor(private _zone: NgZone, public pref: PreferenceService) {
    // Hub.listen("twitter-panel", (e) => {
    //   if (e.payload.message === "update") {
    //     this._zone.run(() => this.updateTweets());
    //   }
    // });
    // Hub.listen("twitter-panel", (e) => {
    //   if (e.payload.message === "render") {
    //     this._zone.run(() => this.ready = true);
    //   }
    // });
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
      log.debug("Tweets reset");
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
    }


    log.debug(this.tweets);
    this.loadPagesOfTweets();
    this.moreToShow = this.maxPage < this.pages.length;
    this.ready = true;

  }

  private loadPagesOfTweets() {
    for (let i = 0; i <= this.maxPage; i++) {
      this.animateTweetAppearance(i);
    }
  }

  public get tweets(): Tweet[] {
    return this._tweets;
  }


  private animateTweetAppearance(page: number) {
    if (typeof this.loaded[page] === undefined) {
      this.loaded[page] = false;
    }
    log.debug("Loading tweets by page " + page);
    if (!this.loaded[page]) {
      twitterLoad(".app-tweet-list-" + this.group + " .tweet-page-" + page);
      // this.loaded[page]= true;
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

  public sender(tweet) {

    return tweet.sender;

  }

  public isPlaceholder(tweet) {
    return !tweet.valid;
  }

  public async ignoreSender(tweet, $event: MouseEvent) {
    await this.pref.ignoreSender(tweet);
    this.update.emit(tweet);
  }

  public async unIgnoreSender(tweet, $event: MouseEvent) {
    await this.pref.unIgnoreSender(tweet);
    this.update.emit(tweet);
  }

  public async ignoreTweet(tweet, $event: MouseEvent) {
    await this.pref.ignoreTweet(tweet);
    this.update.emit(tweet);
  }

  public async unIgnoreTweet(tweet, $event: MouseEvent) {
    await this.pref.unIgnoreTweet(tweet);
    this.update.emit(tweet);
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
    log.debug('scrolled down!!', ev);
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
    if (this.minPage <= this.pages.length - this.INITIAL_PAGES) {
      this.minPage += 1;
    } else {
      this.minPage = Math.max(this.pages.length - this.INITIAL_PAGES, 0);
    }
    log.debug(this.maxPage);
    if (oldMax != this.maxPage) {
      this.loadPagesOfTweets();
    }
    log.debug("New max page " + this.maxPage)
    log.debug("New min page " + this.minPage)
  }

  onUp($event: IInfiniteScrollEvent) {
    log.debug('scrolled up!', $event);

    this.direction = 'up';
    const oldMin = this.minPage;
    if ($event.currentScrollPosition == 0) {
      this.maxPage = this.INITIAL_PAGES - 1;
      this.minPage = 0;
    }
    if (this.maxPage >= this.INITIAL_PAGES) {
      this.maxPage -= 1;

    }
    if (this.minPage > 0) {
      this.minPage -= 1;
    }
    if (oldMin != this.minPage) {
      this.loadPagesOfTweets();
    }
    log.debug("New max page " + this.maxPage)
    log.debug("New min page " + this.minPage)

    // if (this.maxTweets > 100) {
    //   this.maxTweets -= this.PAGE_SIZE;
    // }
  }


}
