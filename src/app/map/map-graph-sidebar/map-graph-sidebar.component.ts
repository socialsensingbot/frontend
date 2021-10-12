import {Component, Input, OnInit} from "@angular/core";
import {RegionSelection} from "../region-selection";
import {MatDialog} from "@angular/material/dialog";
import {DashboardService} from "../../pref/dashboard.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {TimeseriesAnalyticsComponentState} from "../../analytics/timeseries";
import {ActivatedRoute, Router} from "@angular/router";
import {LayerGroup} from "../../types";

const log = new Logger("map-graph-sidebar");

@Component({
               selector:    "app-map-graph-sidebar",
               templateUrl: "./map-graph-sidebar.component.html",
               styleUrls:   ["./map-graph-sidebar.component.scss"]
           })
export class MapGraphSidebarComponent implements OnInit {
    @Input() selection: RegionSelection;

    public regionList: string[] = [];
    public eState: TimeseriesAnalyticsComponentState;
    public cState: TimeseriesAnalyticsComponentState;
    private layer: LayerGroup;

    constructor(public dialog: MatDialog, public dash: DashboardService, public pref: PreferenceService,
                protected _router: Router, private _route: ActivatedRoute) {
    }

    async ngOnInit() {
        await this.pref.waitUntilReady();
        this.layer = this.pref.defaultLayer();
        this.eState = {queries: [], eoc: "exceedance", lob: "line", timePeriod: "day"};
        this.cState = {queries: [], eoc: "count", lob: "line", timePeriod: "day"};
        this.selection.changed.subscribe(i => {
            this.updateStatesForRegions();
        });
        this._route.queryParams.subscribe(async queryParams => {
            if (queryParams.active_layer) {
                this.layer = this.pref.combined.layers.available.filter(i => i.id === queryParams.active_layer)[0];
            }
            this.regionList = this.selection.regionNames();
            this.updateStatesForRegions();
            for (const query of this.eState.queries) {
                query.layer = this.layer;
            }
            for (const query of this.cState.queries) {
                query.layer = this.layer;
            }
        });
    }

    public async expandCountGraph() {
        await this._router.navigate(["/analytics/time"],
                                    {
                                        queryParamsHandling: "merge",
                                        queryParams:         {
                                            selected:      this.regionList,
                                            active_number: "count",
                                            active_layer:  this.layer.id
                                        }
                                    });
    }

    public async expandExceedanceGraph() {
        await this._router.navigate(["/analytics/time"],
                                    {
                                        queryParamsHandling: "merge",
                                        queryParams:         {
                                            selected:      this.regionList,
                                            active_number: "stats",
                                            active_layer:  this.layer.id
                                        }
                                    });
    }

    public showDashboard() {
        this._router.navigate(["/dashboard"]);
    }

    public regionText() {
        return this.selection.asTitleText();
    }

    private updateStatesForRegions(): void {
        this.regionList = this.selection.regionNames();
        this.eState = {queries: [], eoc: "exceedance", lob: "line", timePeriod: "day"};
        this.cState = {queries: [], eoc: "count", lob: "line", timePeriod: "day"};
        for (const region of this.selection.regionNames()) {
            this.cState.queries.push({textSearch: "", regions: [region], __series_id: region, layer: this.layer});
            this.eState.queries.push({textSearch: "", regions: [region], __series_id: region, layer: this.layer});
        }
    }
}
