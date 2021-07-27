import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {RegionSelection} from "../region-selection";
import {MatDialog} from "@angular/material/dialog";
import {DashboardService} from "../../pref/dashboard.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {EOC, TimeseriesAnalyticsComponentState} from "../../analytics/timeseries";
import {Router} from "@angular/router";
import {v4 as uuidv4} from "uuid";

const log = new Logger("map-graph-sidebar");

@Component({
             selector:    "app-map-graph-sidebar",
             templateUrl: "./map-graph-sidebar.component.html",
             styleUrls:   ["./map-graph-sidebar.component.scss"]
           })
export class MapGraphSidebarComponent implements OnInit {
  @Input() selection: RegionSelection;

  public regionList: string[] = [];

  constructor(public dialog: MatDialog, public dash: DashboardService, public pref: PreferenceService,
              protected _router: Router) { }

  ngOnInit(): void {
    this.regionList = this.selection.regionNames();
    this.selection.changed.subscribe(i => this.regionList = this.selection.regionNames());
  }

  public expandCountGraph() {
    this._router.navigate(["/analytics/time"], {queryParams: {region: this.regionList, eoc: "count"}});
  }


  public expandExceedanceGraph() {
    this._router.navigate(["/analytics/time"], {queryParams: {region: this.regionList, eoc: "exceedance"}});
  }

  public showDashboard() {
    this._router.navigate(["/dashboard"]);
  }

  public graphStateForRegions(eoc: EOC): TimeseriesAnalyticsComponentState {
    const state: TimeseriesAnalyticsComponentState = {queries: [], eoc, lob: "line"};
    for (const region of this.selection.regionNames()) {
      state.queries.push({textSearch: "", regions: [region], __series_id: region});
    }
    return state;
  }

  public regionText() {
    return this.selection.asTitleText();
  }
}
