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
        this.ready = true;
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

    }


}
