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

    ngOnInit(): void {
        this.eState = {queries: [], eoc: "exceedance", lob: "line"};
        this.cState = {queries: [], eoc: "count", lob: "line"};
        this.selection.changed.subscribe(i => {
            this.updateStatesForRegions();
        });
        this._route.queryParams.subscribe(async queryParams => {
            this.layer = this.pref.combined.layers.available.filter(i => i.id === queryParams.active_layer)[0];
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

    public expandCountGraph() {
        this._router.navigate(["/analytics/time"], {queryParams: {selected: this.regionList, eoc: "count", active_layer: this.layer.id}});
    }

    public expandExceedanceGraph() {
        this._router.navigate(["/analytics/time"],
                              {queryParams: {selected: this.regionList, eoc: "exceedance", active_layer: this.layer.id}});
    }

    public showDashboard() {
        this._router.navigate(["/dashboard"]);
    }

    public regionText() {
        return this.selection.asTitleText();
    }

    private updateStatesForRegions(): void {
        this.regionList = this.selection.regionNames();
        this.eState = {queries: [], eoc: "exceedance", lob: "line"};
        this.cState = {queries: [], eoc: "count", lob: "line"};
        for (const region of this.selection.regionNames()) {
            this.cState.queries.push({textSearch: "", regions: [region], __series_id: region, layer: this.layer});
            this.eState.queries.push({textSearch: "", regions: [region], __series_id: region, layer: this.layer});
        }
    }
}
