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

const log = new Logger('twitter-panel');

let twitterBound = false;

function twitterLoad(j: number) {
  //todo: the use of setTimeout is very brittle, revisit.
  if ((window as any).twttr && (window as any).twttr.widgets) {
    setTimeout(() => {
      (window as any).twttr.widgets.load($(".atr-" + j + " blockquote")[0]);
    }, 50);
  } else {
    setTimeout(() => twitterLoad(j), 500);
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
        }, 50);

      }
    );
  } else {
    setTimeout(() => twitterInit(), 500);
  }
}

twitterInit();

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
  public visibleCount = 0;
  public ready: boolean;
  private _destroyed: boolean = false;

  // Infinite scroll start: https://github.com/socialsensingbot/frontend/issues/10
  private readonly PAGE_SIZE = 20;
  public scrollDistance = 4;
  public scrollUpDistance = 4;
  public throttle = 300;
  public direction: string;
  public maxTweets = this.PAGE_SIZE * 3;

  // Infinite scroll end

  @Input()
  public set tweets(val: Tweet[] | null) {
    if (val === null) {
      // this.ready = false;
      this._tweets = [];
      this.ready = false;
      console.log("Tweets reset");
      return;
    }
    if (val === this._tweets) {
      log.debug("No change to embeds");
    } else {
      this.updateTweets(val);
    }
  }

  private updateTweets(val: Tweet[]) {
    log.debug("updateTweets()");
    if (this._destroyed) {
      return;
    }
    for (let i = 0; i < val.length; i++) {
      const tweet = val[i];
      if (i >= this.hidden.length) {
        this.hidden.push(true);
      }
      if (i >= this.loaded.length) {
        this.loaded.push(false);
      }
      if (i >= this.tweets.length) {
        this._tweets.push(tweet);
      } else {
        if (this._tweets[i].id !== tweet.id) {
          this._tweets[i] = tweet;
          this.loaded[i] = false;
        }
      }
      const blacklisted = this.pref.isBlacklisted(tweet);
      if (this.hidden[i] !== blacklisted) {
        this.hidden[i] = blacklisted;
      }

      if (i < this.maxTweets) {
        this.appearTweet(i)
      }
    }

    this.visibleCount = this.hidden.filter(i => !i).length;
    log.debug(this.tweets);
    if (this.tweets.length - this.hidden.length > 0) {
      log.debug("Waiting for tweets to load before marking as ready.")
    } else {
      log.debug("No tweets to load so marking as ready.")
      this.ready = true;
    }
  }

  public get tweets(): Tweet[] {
    return this._tweets;
  }

  @Input() showHeaderInfo: boolean = true;
  @Input() showTimeline: boolean;

  constructor(private _ngZone: NgZone, public pref: PreferenceService) {
    // Hub.listen("twitter-panel", (e) => {
    //   if (e.payload.message === "update") {
    //     this._ngZone.run(() => this.updateTweets());
    //   }
    // });
    Hub.listen("twitter-panel", (e) => {
      if (e.payload.message === "render") {
        this._ngZone.run(() => this.ready = true);
      }
    });

  }


  private animateTweetAppearance(start: number) {
    const animatedReappear = (i: number) => {
      if (this._destroyed) {
        return;
      }
      if (i < this.maxTweets) {
        this.appearTweet(i);
        setTimeout(() => this._ngZone.run(() => animatedReappear(i + 1)), 50);
      }

    };
    animatedReappear(start);
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
    const oldMax = this.maxTweets;
    if (this.maxTweets < this.tweets.length - this.PAGE_SIZE) {
      this.maxTweets += this.PAGE_SIZE;
    } else {
      this.maxTweets = this.tweets.length
    }
    log.debug(this.maxTweets);
    if (oldMax != this.maxTweets) {
      this.animateTweetAppearance(0);
    }
  }

  onUp(ev) {
    console.log('scrolled up!', ev);

    this.direction = 'up';

    // if (this.maxTweets > 100) {
    //   this.maxTweets -= this.PAGE_SIZE;
    // }
  }
}
