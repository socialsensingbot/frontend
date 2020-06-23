import {
  Component,
  Input,
  NgZone,
  OnChanges, OnDestroy, OnInit,
  SimpleChanges
} from '@angular/core';
import {PreferenceService} from "../../pref/preference.service";
import {Hub, Logger} from "aws-amplify";
import {Tweet} from "./tweet";
import {
  OnCreateGroupTweetIgnoreSubscription,
  OnCreateGroupTwitterUserIgnoreSubscription,
  OnDeleteGroupTweetIgnoreSubscription, OnDeleteGroupTwitterUserIgnoreSubscription
} from "../../API.service";
import {Subscription} from "rxjs";
import {ExportToCsv} from "export-to-csv";
import {Geometry} from "../types";

const log = new Logger('twitter-panel');

@Component({
             selector:    'twitter-panel',
             templateUrl: './twitter-panel.component.html',
             styleUrls:   ['./twitter-panel.component.scss']
           })
export class TwitterPanelComponent implements OnChanges, OnInit, OnDestroy {

  @Input() count: number;
  @Input() geometry: Geometry;
  @Input() region: string;
  @Input() exceedanceProbability: string;
  private _tweets: Tweet[] | null = null;
  public hiddenTweets: Tweet[] = [];
  public visibleTweets: Tweet[] = [];

  public ready: boolean;
  public tweetsReady: boolean;
  private _destroyed: boolean = false;


  @Input() showHeaderInfo: boolean = true;
  @Input() showTimeline: boolean;
  private tweetIgnoreSub: Subscription;
  private tweetUnignoreSub: Subscription;
  private twitterUserIgnoreSub: Subscription;
  private twitterUserUnignoreSub: Subscription;
  private csvExporter: ExportToCsv;

  constructor(private _zone: NgZone, public pref: PreferenceService) {
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
      this.hiddenTweets = [];
      this.visibleTweets = [];
      this.ready = true;
      log.debug("Tweets reset");
      return;
    }

    this.updateTweets(val);

  }


  public get tweets(): Tweet[] | null {
    return this._tweets != null ? this._tweets : [];
  }

  private updateTweets(val: Tweet[]) {
    this._tweets = val;
    log.debug("updateTweets()");
    if (this._destroyed) {
      return;
    }
    this.update(null);
    this.tweetsReady = true;
  }


  public show($event: any) {
    log.debug($event);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    log.debug(changes);
    // (window as any).twttr.widgets.load($("#tinfo")[0]);
  }


  public update(tweet: Tweet) {

    this.visibleTweets = this._tweets.filter(i => !this.pref.isBlacklisted(i));
    this.hiddenTweets = this._tweets.filter(i => this.pref.isBlacklisted(i));
    this.ready = true;
    this.tweetsReady = true;
  }


  public refresh() {
    const tweets = this.tweets
    this.tweets = [];
    this.ready = false;
    this.tweetsReady = false;
    setTimeout(() => this._zone.run(() => {
      this.tweets = tweets;
      this.tweetsReady = true
    }), 50);
  }

  public ngOnDestroy(): void {
    if (this.tweetIgnoreSub) {
      this.tweetIgnoreSub.unsubscribe();
    }
    if (this.tweetUnignoreSub) {
      this.tweetUnignoreSub.unsubscribe();
    }
    if (this.twitterUserIgnoreSub) {
      this.twitterUserIgnoreSub.unsubscribe();
    }
    if (this.twitterUserUnignoreSub) {
      this.twitterUserUnignoreSub.unsubscribe();
    }
  }

  public ngOnInit(): void {
    this.tweetIgnoreSub = this.pref.tweetIgnored.subscribe((sub: OnCreateGroupTweetIgnoreSubscription) => {
      this.update(null)
    });
    this.tweetUnignoreSub = this.pref.tweetUnignored.subscribe((sub: OnDeleteGroupTweetIgnoreSubscription) => {
      this.update(null)
    });
    this.twitterUserIgnoreSub = this.pref.twitterUserIgnored.subscribe(
      (sub: OnCreateGroupTwitterUserIgnoreSubscription) => {
        this.update(null)
      });
    this.twitterUserUnignoreSub = this.pref.twitterUserUnignored.subscribe(
      (sub: OnDeleteGroupTwitterUserIgnoreSubscription) => {
        this.update(null)
      });
  }

  public download() {
    let region = `${this.region}`;
    let filename = `region-${this.region.replace(" ", "-").toLocaleLowerCase()}-tweet-export`

    if (this.region.match(/\d+/)) {
      let minX = null;
      let maxX = null;
      let minY = null;
      let maxY = null;
      for (const point of this.geometry.coordinates[0]) {
        if (minX === null || point[0] < minX) {
          minX = point[0];
        }
        if (minY === null || point[1] < minY) {
          minY = point[1];
        }
        if (maxX === null || point[0] > maxX) {
          maxX = point[0];
        }
        if (maxY === null || point[1] > maxY) {
          maxY = point[1];
        }
      }
      console.log(
        `Bounding box of ${JSON.stringify(this.geometry.coordinates[0])} is (${minX},${minY}) to (${maxX},${maxY})`)
      region = `(${minX},${minY}),(${maxX},${maxY})`
    }
    const options = {
      fieldSeparator:   ',',
      quoteStrings:     '"',
      decimalSeparator: '.',
      showLabels:       true,
      showTitle:        false,
      title:            region,
      useTextFile:      false,
      useBom:           true,
      useKeysAsHeaders: true,
      filename: filename
      // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
    };

    this.csvExporter = new ExportToCsv(options);
    this.csvExporter.generateCsv(this.visibleTweets.filter(i => i.valid).map(i => i.asCSV(region)));
  }
}
