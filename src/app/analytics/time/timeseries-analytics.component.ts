import {Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {MetadataService} from "../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {
  TimeseriesAnalyticsComponentState,
  TimeseriesCollectionModel,
  TimeseriesModel,
  TimeseriesRESTQuery
} from "../timeseries";
import {v4 as uuidv4} from "uuid";
import {UIExecutionService} from "../../services/uiexecution.service";
import {SavedGraphService} from "../../services/saved-graph.service";
import {SavedGraph} from "../../../models";
import {SaveGraphDialogComponent} from "./save-graph-dialog/save-graph-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {NotificationService} from "src/app/services/notification.service";
import {toLabel} from "../graph";
import {DashboardService} from "../../pref/dashboard.service";

const log = new Logger("timeseries-ac");


@Component({
             selector:    "app-timeseries-analytics",
             templateUrl: "./timeseries-analytics.component.html",
             styleUrls:   ["./timeseries-analytics.component.scss"]
           })
export class TimeseriesAnalyticsComponent implements OnInit, OnDestroy, OnChanges {

  public height: number;
  public dateRangeFilter = true;
  public regionFilter = true;
  public textFilter = true;
  public source = "twitter";
  public hazard = "flood";
  public yLabel = "Count";
  public xField = "date";
  public yField = "count";
  public animated = false;
  public ready: boolean;
  public updating = false;
  public error: boolean;
  public scrollBar = true;
  public changed = new EventEmitter();
  public removable = true;
  public mappingColumns: string[] = [];
  public showForm = true;
  public connect = false;
  public activity: boolean;
  public seriesCollection: TimeseriesCollectionModel;
  public appToolbarExpanded = false;
  public savedGraphs: SavedGraph[] = [];
  public title = "";
  public graphId: string;
  private _savedGraphType = "timeseries-graph";
  private _interval: number;
  private _changed: boolean;
  private _storeQueryInURL: boolean;

  constructor(public metadata: MetadataService, protected _zone: NgZone, protected _router: Router,
              public notify: NotificationService,
              protected _route: ActivatedRoute, protected _api: RESTDataAPIService, public pref: PreferenceService,
              public exec: UIExecutionService, public saves: SavedGraphService, public dialog: MatDialog,
              public dash: DashboardService) {
    this.seriesCollection = new TimeseriesCollectionModel(this.xField, this.yField, this.yLabel, "Date");
    this.updateSavedGraphs();
    this.ready = true;

  }

  private _type = "line";

  public get type(): string {
    return this._type;
  }

  @Input()
  public set type(value: string) {
    this._type = value;
  }

  private _state: TimeseriesAnalyticsComponentState = this.defaultState();

  public get state(): any {
    return this._state;
  }

  @Input()
  public set state(value: any) {
    this._state = value;
  }

  public updateSavedGraphs() {
    this.saves.listByOwner().then(i => this.savedGraphs = i);
  }

  async ngOnInit() {
    this._route.params.subscribe(async params => {
      if (params.id) {
        this.graphId = params.id;
        const savedGraph = await this.saves.get(params.id);
        if (savedGraph !== null) {
          this.title = savedGraph.title;
          this.state = JSON.parse(savedGraph.state);
          console.log("Loaded saved graph with state ", this.state);
          this.seriesCollection.clear();
          for (const query of this.state.queries) {
            await this.updateGraph(query, true);
          }
          this.exec.uiActivity();
          this.ready = true;
        } else {
          this.navigateToRoot();
        }
      } else {
        await this.clear();
        this.graphId = null;
        this.title = "";
        this.ready = true;
        let doUpdate = false;
        const queryParams = this._route.snapshot.queryParams;
        if (typeof queryParams.textSearch !== "undefined") {
          this.state.queries[0].textSearch = queryParams.textSearch;
          doUpdate = true;
        }
        if (typeof queryParams.region !== "undefined") {
          this.state.queries[0].regions = Array.isArray(queryParams.region) ? queryParams.region : [queryParams.region];
          doUpdate = true;
        }
        if (doUpdate) {
          await this.updateGraph(this.state.queries[0], true);
        }
      }
    });

  }

  public emitChange() {

    this.changed.emit(this.state);
  }

  public ngOnDestroy(): void {
    window.clearInterval(this._interval);
  }

  public async updateGraph(q: TimeseriesRESTQuery, force) {
    // Immutable copy
    const query = JSON.parse(JSON.stringify(q));
    this.updating = true;
    await this.exec.queue("update-timeseries-graph", null,
                          async () => {
                            log.debug("Graph update from query ", query);
                            this._changed = true;
                            this.emitChange();
                            if (query.textSearch.length > 0 || query.regions.length > 0 || force) {
                              await this._updateGraphInternal(query);
                            } else {
                              log.debug("Skipped time series update, force=" + force);
                            }
                            this.updating = false;

                          }, query.__series_id + "-" + force, false, true, true, "inactive"
    );

  }

  async saveGraph(duplicate = false): Promise<void> {
    if (!this.graphId || duplicate) {

      const title = duplicate ? "" : (this.title || "");
      const dialogData = {
        dialogTitle: "Save Timeseries Graph",
        state:       this.state,
        type:        this._savedGraphType,
        title
      };
      const dialogRef = this.dialog.open(SaveGraphDialogComponent, {
        width: "500px",
        data:  dialogData
      });

      dialogRef.afterClosed().subscribe(async result => {
        if (result !== null) {
          this.savedGraphs = await this.saves.listByOwner();

          const savedGraph = await this.saves.create(dialogData.type, dialogData.title, this.state);
          this.graphId = savedGraph.id;
          this.title = dialogData.title;
          this.updateSavedGraphs();
          this._router.navigate(["/analytics/time/" + this.graphId], {queryParamsHandling: "preserve"});

        }
      });
    } else {
      this.updating = true;
      await this.saves.update(this.graphId, this.title, this.state);
      this.updateSavedGraphs();
      this.notify.show("Saved graph '" + this.title + "'", "Great!", 4);
      this.updating = false;
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
  }

  public async addQuery(query: TimeseriesRESTQuery) {
    await this._updateGraphInternal(query);

    if (!this.state.queries) {
      this.state.queries = [];
    }

    const newQuery = this.newQuery();
    log.info("Adding query ", newQuery);
    this.state.queries.unshift(newQuery);

    await this.updateGraph(newQuery, false);
  }

  public refreshGraph() {

  }

  public eocChanged() {
    this.exec.uiActivity();
    this.seriesCollection.yLabel = this.state.eoc === "exceedance" ? "Exceedance" : "Count";
    this.seriesCollection.yField = this.state.eoc === "exceedance" ? "exceedance" : "count";
    this.seriesCollection.yAxisHasChanged();
    this.exec.uiActivity();
  }

  public removeQuery(query: TimeseriesRESTQuery) {
    this.state.queries = this.state.queries.filter(i => i.__series_id !== query.__series_id);
    this.seriesCollection.removeTimeseries(query.__series_id);
    this.exec.uiActivity();
  }

  public async clear() {
    this.state.queries = [this.newQuery()];
    this._updateGraphInternal(this.state.queries[0]);
    this.seriesCollection.clear();
    this.exec.uiActivity();
  }

  public graphTypeChanged(type: "bar" | "line") {
    this.exec.uiActivity();
    this.seriesCollection.graphType = type;
  }

  public async deleteSavedGraph(id: string) {
    await this.saves.delete(id);
    if (id === this.graphId) {
      this.navigateToRoot();
    }
  }

  protected async executeQuery(query: TimeseriesRESTQuery): Promise<any[]> {
    if (this._storeQueryInURL) {
      await this._router.navigate([], {queryParams: query});
    }

    this.updating = true;
    try {
      const serverResults = await this._api.callAPI("query", {
        ...query,
        name:   "time",
        source: this.source,
        hazard: this.hazard
      });
      this.error = false;
      return this.queryTransform(serverResults);
    } catch (e) {
      log.error(e);
      this.error = true;
      return null;
    } finally {
      this.updating = false;
    }


    this.ready = true;
  }

  protected queryTransform(from: any[]): any[] {
    return from;
  }

  private defaultState(): TimeseriesAnalyticsComponentState {
    return {eoc: "count", lob: "line", queries: [this.newQuery()]};
  }

  private async _updateGraphInternal(query) {
    const queryResult = await this.executeQuery(query);
    if (queryResult && queryResult.length > 0) {
      this.seriesCollection.updateTimeseries(
        new TimeseriesModel(toLabel(query), queryResult,
                            query.__series_id));
    } else {
      log.warn(queryResult);
    }
  }

  private newQuery(): TimeseriesRESTQuery {
    return {
      __series_id: uuidv4(),
      regions:     [],
      textSearch:  "",
      from:        new Date().getTime() - (365.24 * 24 * 60 * 60 * 1000),
      to:          new Date().getTime(),
      dateStep:    7 * 24 * 60 * 60 * 1000
    };
  }

  private navigateToRoot() {
    this._router.navigate(["/analytics/time"], {queryParamsHandling: "merge"});
  }


  public showDashboard() {
    this._router.navigate(["/dashboard"]);
  }
}



