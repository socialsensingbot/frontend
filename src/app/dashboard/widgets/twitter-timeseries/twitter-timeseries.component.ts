import {Component, Input, NgZone, OnDestroy, OnInit} from "@angular/core";
import {StandardGraphComponent} from "../../standard-graph-component";
import {MetadataService} from "../../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {HistoricalDataService} from "../../../api/historical-data.service";

@Component({
               selector:    "app-twitter-timeseries",
               templateUrl: "./twitter-timeseries.component.html",
               styleUrls:   ["./twitter-timeseries.component.scss"]
           })
export class TwitterTimeseriesComponent extends StandardGraphComponent implements OnInit, OnDestroy {
    @Input()
    public height: number;

    constructor(metadata: MetadataService, zone: NgZone, router: Router, route: ActivatedRoute,
                _api: HistoricalDataService) {
        super(metadata, zone, router, route, _api, "twitter_timeseries", false);
    }

    public ngOnDestroy(): void {
        window.clearInterval(this._interval);
    }

    public ngOnInit(): void {
        this._interval = this.startChangeTimer();
    }
}
