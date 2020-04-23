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
import {Hub} from "aws-amplify";


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
        console.log(event);
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
  @Input() exceedenceProbability: string;
  private _embeds: string;
  public tweets: string[];
  public hidden: boolean[] = [];
  public visibleCount = 0;
  ready: boolean;
  private _destroyed: boolean = false;

  @Input()
  public set embeds(val: any) {
    if (val === this._embeds) {
      console.log("No change to embeds");
    } else {
      this._embeds = val;
      this.updateTweets();
    }
  }

  private updateTweets() {
    console.log("updateTweets()");
    if (this._destroyed) {
      return;
    }
    if (typeof this._embeds !== "undefined") {
      this.ready = false;
      console.log(this._embeds);
      const regex = /(<blockquote(.*?)<\/blockquote>)/g;
      this.tweets = this._embeds.match(regex).map(s => s);
      this.hidden = [];
      this.tweets.forEach(tweet => {
        this.hidden.push(this.pref.isBlacklisted(tweet))
      });
      this.visibleCount = this.hidden.filter(i => !i).length;
      console.log(this.tweets);
      if (this.tweets.length > 0) {
        //
        // (window as any).twttr.widgets.load($("#tinfo")[0]);

      } else {
        this.ready = true;
      }
      this.animateTweetAppearance();
    }
  }

  public get embeds(): any {
    return this._embeds;
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
          console.log("Loading tweet " + i);
          twitterLoad(i);
        } else {
          console.log("Skipping " + i);
        }
        setTimeout(() => this._ngZone.run(() => animatedReappear(i + 1)), 200);
      }

    };
    animatedReappear(0);
  }

  public show($event: any) {
    console.log($event);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
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
    const parsed = this.pref.parseTweet(tweet);
    if (parsed != null) {
      return parsed.sender;
    }
  }

  public isPlaceholder(tweet) {
    return this.pref.parseTweet(tweet) == null;
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
