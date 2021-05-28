import {Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {PreferenceService} from "../../pref/preference.service";
import {Hub, Logger} from "@aws-amplify/core";
import {CSVExportTweet, Tweet} from "./tweet";
import {Subscription} from "rxjs";
import {ExportToCsv} from "export-to-csv";
import {RegionSelection} from "../region-selection";
import {AnnotationService} from "../../pref/annotation.service";
import {readableTimestamp} from "../../common";

const log = new Logger("twitter-panel");

@Component({
             selector:    "twitter-panel",
             templateUrl: "./twitter-panel.component.html",
             styleUrls:   ["./twitter-panel.component.scss"]
           })
export class TwitterPanelComponent implements OnChanges, OnInit, OnDestroy {


  @Input() selection: RegionSelection;
  public hiddenTweets: Tweet[] = [];
  public visibleTweets: Tweet[] = [];
  public ready: boolean;
  public tweetsReady: boolean;
  @Input() showHeaderInfo = true;
  @Input() showTimeline: boolean;
  private _destroyed = false;
  private tweetIgnoreSub: Subscription;
  private tweetUnignoreSub: Subscription;
  private twitterUserIgnoreSub: Subscription;
  private twitterUserUnignoreSub: Subscription;
  private csvExporter: ExportToCsv;

  constructor(private _zone: NgZone, public pref: PreferenceService, private _annotation: AnnotationService) {
    Hub.listen("twitter-panel", (e) => {
      if (e.payload && e.payload.message === "refresh") {
        this._zone.run(() => this.updateTweets(this._tweets));
      }
    });


  }

  private _tweets: Tweet[] | null = null;

  public get tweets(): Tweet[] | null {
    return this._tweets != null ? this._tweets : [];
  }

  @Input()
  public set tweets(val: Tweet[] | null) {
    if (val === null) {
      // this.ready = false;
      this._tweets = [];
      this.hiddenTweets = [];
      this.visibleTweets = [];
      this.pref.waitUntilReady().then(i => this.ready = true);
      log.debug("Tweets reset");
      return;
    }

    this.updateTweets(val);

  }

  public show($event: any) {
    log.debug($event);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    log.debug(changes);
    // (window as any).twttr.widgets.load($("#tinfo")[0]);
  }

  public update(tweet: Tweet) {

    this.pref.waitUntilReady().then(i => this.ready = true);
    this.visibleTweets = this._tweets.filter(i => !this.pref.isBlacklisted(i));
    this.hiddenTweets = this._tweets.filter(i => this.pref.isBlacklisted(i));
    this.tweetsReady = true;
  }

  public refresh() {
    const tweets = this.tweets;
    this.tweets = [];
    this.pref.waitUntilReady().then(i => this.ready = true);
    this.tweetsReady = false;
    setTimeout(() => this._zone.run(() => {
      this.tweets = tweets;
      this.tweetsReady = true;
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
    this.tweetIgnoreSub = this.pref.tweetIgnored.subscribe((sub) => {
      this.update(null);
    });
    this.tweetUnignoreSub = this.pref.tweetUnignored.subscribe((sub) => {
      this.update(null);
    });
    this.twitterUserIgnoreSub = this.pref.twitterUserIgnored.subscribe(
      (sub) => {
        this.update(null);
      });
    this.twitterUserUnignoreSub = this.pref.twitterUserUnignored.subscribe(
      (sub) => {
        this.update(null);
      });
  }

  public async download() {
    let filename;
    if (this.selection.count === 1) {
      filename = `${this.selection.firstRegion().name}-tweet-export-${readableTimestamp()}`;
    } else {
      filename = `multiple-regions-tweet-export-${readableTimestamp()}`;
    }

    const options = {
      fieldSeparator:   ",",
      quoteStrings:     "\"",
      decimalSeparator: ".",
      showLabels:       true,
      showTitle:        false,
      title:            "",
      useTextFile:      false,
      useBom:           true,
      useKeysAsHeaders: true,
      filename
      // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
    };

    this.csvExporter = new ExportToCsv(options);
    const exportedPromises = await this.visibleTweets.filter(i => i.valid)
                                       .map(
                                         async i => {
                                           const annotationRecord = await this._annotation.getAnnotations(i);
                                           let annotations = {};
                                           if (annotationRecord && annotationRecord.annotations) {
                                             annotations = JSON.parse(annotationRecord.annotations);
                                           }
                                           return i.asCSV(this.selection.regionMap(),
                                                          this.pref.combined.sanitizeForGDPR, annotations);
                                         });
    const result: CSVExportTweet[] = [];
    for (const exportedPromise of exportedPromises) {
      result.push(await exportedPromise);
    }

    this.csvExporter.generateCsv(result);
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
}
