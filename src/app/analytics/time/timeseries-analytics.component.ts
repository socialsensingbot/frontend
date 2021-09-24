import {Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {MetadataService} from "../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {
    TimeseriesAnalyticsComponentState,
    timeSeriesAutocompleteType,
    TimeseriesCollectionModel,
    TimeseriesModel,
    TimeseriesRESTQuery
} from "../timeseries";
import {v4 as uuidv4} from "uuid";
import {UIExecutionService} from "../../services/uiexecution.service";
import {SavedGraphService} from "../../services/saved-graph.service";
import {SavedGraph} from "../../../models";
import {NameGraphDialogComponent} from "./name-graph-dialog/name-graph-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {NotificationService} from "src/app/services/notification.service";
import {toLabel} from "../graph";
import {DashboardService} from "../../pref/dashboard.service";
import {dayInMillis, nowRoundedToHour} from "../../common";
import {TextAutoCompleteService} from "../../services/text-autocomplete.service";

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
    public sources = ["twitter"];
    public hazards = ["flood"];
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
                public dash: DashboardService, public auto: TextAutoCompleteService) {
        this.seriesCollection = new TimeseriesCollectionModel(this.xField, this.yField, this.yLabel, "Date");
        this.updateSavedGraphs();
        this.pref.waitUntilReady().then(() => this.dash.waitUntilReady().then(async () => {
            this.ready = true;
        }));

    }


    private _type = "line";

    public get type(): string {
        return this._type;
    }

    @Input()
    public set type(value: string) {
        this._type = value;
    }

    private _state: TimeseriesAnalyticsComponentState;

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
        await this.pref.waitUntilReady();
        await this.clear();

        log.info("State is now " + JSON.stringify(this.state));
        await this.updateGraph(this.state.queries[0], true);

        this._route.queryParams.subscribe(async queryParams => {
            if (queryParams.__clear_ui__) {
                await this.clear();
                await this._router.navigate([], {});
            }
        });
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
                } else {
                    this.navigateToRoot();
                }
            } else {
                this.graphId = null;
                this.title = "";
                const queryParams = this._route.snapshot.queryParams;
                if (typeof queryParams.textSearch !== "undefined") {
                    this.state.queries[0].textSearch = queryParams.textSearch;
                }
                if (typeof queryParams.region !== "undefined") {
                    this.state = this.defaultState();
                    log.info("State is now " + this.state);
                    if (Array.isArray(queryParams.region)) {
                        for (const region of queryParams.region) {
                            const newQuery = this.newQuery();
                            newQuery.regions.push(region);
                            this.state.queries = [newQuery];
                            await this.updateGraph(newQuery, true);
                        }
                    } else {
                        this.state.queries[0].regions = [queryParams.region];
                        await this._updateGraphInternal(this.state.queries[0]);
                    }
                } else {
                    this.state.queries[0].regions = this.pref.combined.analyticsDefaultRegions;
                    await this.updateGraph(this.state.queries[0], false);

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
                                  if (query.textSearch.length > 0 || force) {
                                      this.emitChange();
                                      if (query.textSearch.length > 3) {
                                          // noinspection ES6MissingAwait
                                          this.auto.create(timeSeriesAutocompleteType, query.textSearch, true,
                                                           this.pref.combined.shareTextAutocompleteInGroup);
                                      }
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
                title
            };
            const dialogRef = this.dialog.open(NameGraphDialogComponent, {
                width: "500px",
                data:  dialogData
            });

            dialogRef.afterClosed().subscribe(async result => {
                if (result !== null) {
                    this.savedGraphs = await this.saves.listByOwner();

                    const savedGraph = await this.saves.create(this._savedGraphType, dialogData.title, this.state);
                    this.graphId = savedGraph.id;
                    this.title = dialogData.title;
                    this.updateSavedGraphs();
                    await this._router.navigate(["/analytics/time/" + this.graphId], {queryParamsHandling: "preserve"});

                }
            });
        } else {
            this.updating = true;
            await this.saves.update(this.graphId, this.title, this.state);
            this.updateSavedGraphs();
            this.notify.show("Saved graph '" + this.title + "'", "Great!", 4000);
            this.updating = false;
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
    }

    public async addQuery(query: TimeseriesRESTQuery) {

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
        this.seriesCollection.yLabel = this.state.eoc === "exceedance" ? "Return Period" : "Count";
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
        log.info("Clearing graph");
        this.state = this.defaultState();
        log.info("State is now " + this.state);
        this.seriesCollection.clear();
        this.state.queries[0].regions = this.pref.combined.analyticsDefaultRegions;
        await this._updateGraphInternal(this.state.queries[0]);

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
            const payload = {
                ...query,
                from: nowRoundedToHour() - (365.24 * dayInMillis),
                to:   nowRoundedToHour(),
                name: "time",
            };
            delete payload.__series_id;
            const serverResults = await this._api.callQueryAPI("query", payload);
            log.debug("Server result was ", serverResults);
            this.error = false;
            return this.queryTransform(serverResults);
        } catch (e) {
            log.error(e);
            this.error = true;
            return null;
        } finally {
            this.updating = false;
        }


    }

    protected queryTransform(from: any[]): any[] {
        return from;
    }

    private defaultState(): TimeseriesAnalyticsComponentState {
        const query: TimeseriesRESTQuery = this.newQuery();
        return {eoc: "count", lob: "line", queries: [this.newQuery()]};
    }

    private async _updateGraphInternal(query) {
        const queryResult = await this.executeQuery(query);
        if (queryResult && queryResult.length > 0) {
            this.seriesCollection.updateTimeseries(
                new TimeseriesModel(toLabel(query, this.pref.combined.layers), queryResult,
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
            from:        nowRoundedToHour() - (365.24 * dayInMillis),
            to:          nowRoundedToHour(),
            dateStep:    7 * dayInMillis,
            layer: this.pref.combined.layers.available.filter(i => i.id === this.pref.combined.layers.defaultLayer)
        };
    }

    private navigateToRoot() {
        this._router.navigate(["/analytics/time"], {queryParamsHandling: "merge"});
    }


    public showDashboard() {
        this._router.navigate(["/dashboard"]);
    }

    public async addToDashboard() {

        const dialogData = {
            dialogTitle: "Add to Dashboard",
            title:       (this.title || "")
        };
        const dialogRef = this.dialog.open(NameGraphDialogComponent, {
            width: "500px",
            data:  dialogData
        });

        dialogRef.afterClosed().subscribe(async result => {
            if (result !== null) {
                await this.dash.addCard("timeseries", dialogData.title,
                                        1, 1, this.state);
                this.showDashboard();
            }
        });


    }
}
