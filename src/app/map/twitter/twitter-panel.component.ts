import {Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {PreferenceService} from "../../pref/preference.service";
import {Logger} from "@aws-amplify/core";
import {Tweet, TweetCriteria} from "./tweet";
import {Subscription} from "rxjs";
import {ExportToCsv} from "export-to-csv";
import {RegionSelection} from "../region-selection";
import {AnnotationService} from "../../pref/annotation.service";
import {TwitterExporterService} from "./twitter-exporter.service";
import {RESTMapDataService} from "../data/rest-map-data.service";
import {MatTabChangeEvent} from "@angular/material/tabs";

const log = new Logger("twitter-panel");

@Component({
               selector:    "twitter-panel",
               templateUrl: "./twitter-panel.component.html",
               styleUrls:   ["./twitter-panel.component.scss"]
           })
export class TwitterPanelComponent implements OnChanges, OnInit, OnDestroy {
    private _tweetCriteria: TweetCriteria;

    public get tweetCriteria(): TweetCriteria {
        return this._tweetCriteria;
    }


    @Input() selection: RegionSelection;

    @Input()
    public set tweetCriteria(criteria: TweetCriteria | null) {
        this._tweetCriteria = criteria;

    }

    private _tweetCount: number;
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
    @Input()
    private layer: string;

    public get tweetCount(): number {
        return this._tweetCount;
    }

    @Input()
    public set tweetCount(value: number) {
        this._tweetCount = value;
    }

    constructor(private _zone: NgZone, public pref: PreferenceService, private _annotation: AnnotationService,
                private _exporter: TwitterExporterService, private data: RESTMapDataService) {


    }

    public hiddenTweets: (t: Tweet[]) => Tweet[] = (tweets) => tweets.filter(i => this.pref.isBlacklisted(i));

    public visibleTweets: (t: Tweet[]) => Tweet[] = (tweets) => tweets.filter(i => !this.pref.isBlacklisted(i));

    public show($event: any) {
        log.debug($event);
    }

    public ngOnChanges(changes: SimpleChanges): void {
        log.debug(changes);
        // (window as any).twttr.widgets.load($("#tinfo")[0]);
    }

    public update(tweet: Tweet) {

        this.pref.waitUntilReady().then(i => this.ready = true);
        this.tweetsReady = true;
        log.debug("tweets ready")
    }

    public refresh() {
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

    public async ngOnInit(): Promise<void> {
        await this.pref.waitUntilReady();
        //We won't get an update event from the child panels if there are no tweets
        //so here we set the status to ready.
        if (this.selection.tweetCount() == 0) {
            this.ready = true;
        }
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
        let tweetRequest: Promise<Tweet[]>;
        // @ts-ignore
        tweetRequest = this.data.tweets(this._tweetCriteria.layerGroup, this._tweetCriteria.regionType, this._tweetCriteria.regionNames,
                                        this._tweetCriteria.min,
                                        this._tweetCriteria.max, 0, 100000, "exclude",
                                        await this.pref.getTweetBlackList(),
                                        await this.pref.getTwitterUserBlackList());
        const tweets = (await tweetRequest).filter(async value => !this.pref.isTweetIgnored(value) && value.valid);
        await this._exporter.exportToCSV(tweets, this.selection.all(), this.annotationTypes,
                                         this.layer);
    }

    private updateTweets(val: Tweet[]) {

    }

    public tabChanged($event: MatTabChangeEvent): void {
        this.update(null);
    }
}
