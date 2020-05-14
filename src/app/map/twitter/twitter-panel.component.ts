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
    }, 500);
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
          event.target.parentNode.style.opacity = 1.0;
        }, 500);

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
  private _tweets: Tweet[];
  public hidden: boolean[] = [];
  public visibleCount = 0;
  ready: boolean;
  private _destroyed: boolean = false;

  @Input()
  public set tweets(val: Tweet[]) {
    if (val === this._tweets) {
      log.debug("No change to embeds");
    } else {
      this._tweets = val;
      this.updateTweets();
    }
  }

  private updateTweets() {
    log.debug("updateTweets()");
    if (this._destroyed) {
      return;
    }
    if (typeof this._tweets !== "undefined") {
      this.ready = false;
      this.hidden = [];
      this.tweets.forEach(tweet => {
        this.hidden.push(this.pref.isBlacklisted(tweet))
      });
      this.visibleCount = this.hidden.filter(i => !i).length;
      log.debug(this.tweets);
      if (this.tweets.length - this.hidden.length > 0) {
        log.debug("Waiting for tweets to load before marking as ready.")
      } else {
        log.debug("No tweets to load so marking as ready.")
        this.ready = true;
      }
      this.animateTweetAppearance();
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


  private animateTweetAppearance() {
    const animatedReappear = (i: number) => {
      if (this._destroyed) {
        return;
      }
      if (i < this.tweets.length) {
        if ($(".atr-" + i + " blockquote").has("a")) {
          log.debug("Loading tweet " + i);
          twitterLoad(i);
        } else {
          log.debug("Skipping " + i);
        }
        setTimeout(() => this._ngZone.run(() => animatedReappear(i + 1)), 200);
      }

    };
    animatedReappear(0);
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

}
