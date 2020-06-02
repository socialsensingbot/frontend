import {
    Component,
    Input,
    NgZone,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import {PreferenceService} from "../../pref/preference.service";
import {Hub, Logger} from "aws-amplify";
import {Tweet} from "./tweet";

const log = new Logger('twitter-panel');
@Component({
               selector:    'twitter-panel',
               templateUrl: './twitter-panel.component.html',
               styleUrls:   ['./twitter-panel.component.scss']
           })
export class TwitterPanelComponent implements OnChanges {

    @Input() count: number;
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
            this.ready = false;
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
}
