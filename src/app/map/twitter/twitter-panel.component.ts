import {Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {PreferenceService} from "../../pref/preference.service";
import {Hub, Logger} from "@aws-amplify/core";
import {Tweet} from "./tweet";
import {Subscription} from "rxjs";
import {ExportToCsv} from "export-to-csv";
import {RegionSelection} from "../region-selection";
import {AnnotationService} from "../../pref/annotation.service";
import {TwitterExporterService} from "./twitter-exporter.service";

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

    private _tweets: Tweet[] | null = null;

    @Input()
    public annotationTypes: any[];

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

    constructor(private _zone: NgZone, public pref: PreferenceService, private _annotation: AnnotationService,
                private _exporter: TwitterExporterService) {
        Hub.listen("twitter-panel", (e) => {
            if (e.payload && e.payload.message === "refresh") {
                this._zone.run(() => this.updateTweets(this._tweets));
            }
        });


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
        this._exporter.exportToCSV(this.visibleTweets.filter(i => i.valid), this.selection.all());
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
