import {Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {MetadataService} from "../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {
    EOC,
    TimePeriod,
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
import {dayInMillis, hourInMillis, nowRoundedToHour} from "../../common";
import {TextAutoCompleteService} from "../../services/text-autocomplete.service";
import {LayerGroup} from "../../types";
import {FormControl, FormGroup} from "@angular/forms";

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
    public eoc: EOC = "exceedance";

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

    public range: FormGroup = new FormGroup({
                                                start: new FormControl(new Date()),
                                                end:   new FormControl(new Date())
                                            });

    public get state(): TimeseriesAnalyticsComponentState {
        return this._state;
    }

    public updateSavedGraphs() {
        this.saves.listByOwner().then(i => this.savedGraphs = i);
    }

    public defaultLayer: LayerGroup = null;

    @Input()
    public set state(value: TimeseriesAnalyticsComponentState) {
        this._state = value;
    }
    ;

    public emitChange() {

        this.changed.emit(this.state);
    }

    public ngOnDestroy(): void {
        window.clearInterval(this._interval);
    }

    async ngOnInit() {
        await this.pref.waitUntilReady();


        this._route.queryParams.subscribe(async queryParams => {
            if (queryParams.__clear_ui__) {
                await this.clear();
                await this._router.navigate([], {});
            }
            if (queryParams.active_layer) {
                this.defaultLayer = this.pref.combined.layers.available.filter(i => i.id === queryParams.active_layer)[0];
            }
        });
        this._route.params.subscribe(async params => {
            const queryParams = this._route.snapshot.queryParams;
            if (queryParams.active_layer) {
                this.defaultLayer = this.pref.combined.layers.available.filter(i => i.id === queryParams.active_layer)[0];
            } else {
                this.defaultLayer = this.pref.defaultLayer();
            }

            log.info("State is now " + JSON.stringify(this.state));
            if (params.id) {
                await this.clear(true);
                this.setEOCFromQuery(queryParams);
                this.graphId = params.id;
                const savedGraph = await this.saves.get(params.id);
                if (savedGraph !== null) {
                    this.title = savedGraph.title;
                    this.state = JSON.parse(savedGraph.state);
                    console.log("Loaded saved graph with state ", this.state);
                    await this.refreshAllSeries();
                    this.exec.uiActivity();
                } else {
                    this.navigateToRoot();
                }
            } else {
                this.graphId = null;
                this.title = "";
                if (typeof queryParams.text_search !== "undefined") {
                    this.state.queries[0].textSearch = queryParams.text_search;
                }
                if (typeof queryParams.selected !== "undefined" && queryParams.active_polygon === "county") {
                    await this.clear(true);
                    log.info("State is now " + this.state);
                    if (Array.isArray(queryParams.selected)) {
                        for (const region of queryParams.selected) {
                            const newQuery = this.newQuery();
                            newQuery.regions.push(region);
                            this.state.queries = [newQuery];
                            await this.updateGraph(newQuery, this.state.timePeriod, true);
                        }
                    } else {
                        this.state.queries = [this.newQuery()];
                        this.state.queries[0].regions = [queryParams.selected];
                        await this._updateGraphInternal(this.state.queries[0], this.state.timePeriod);
                    }
                    this.setEOCFromQuery(queryParams);
                } else {
                    await this.clear(false);
                    this.state.queries[0].regions = this.pref.combined.analyticsDefaultRegions;
                    this.setEOCFromQuery(queryParams);
                    await this.updateGraph(this.state.queries[0], this.state.timePeriod, true);

                }
            }

        });


    }

    public async refreshAllSeries(): Promise<void> {
        log.debug("Refreshing all series");
        for (const query of this.state.queries) {
            if (!query.layer) {
                query.layer = this.defaultLayer;
            }
            await this.updateGraph(query, this.state.timePeriod, true);
        }
    }

    public userChangedEOC(type: EOC) {
        this.eoc = type;
        this.eocChanged();
        // this._router.navigate([], {
        //     queryParams:         {active_number: (type === "count" ? "count" : "stats")},
        //     queryParamsHandling: "merge"
        // });
    }

    public eocChanged() {
        log.debug("EOC changed to " + this.eoc);
        this.state.eoc = this.eoc;
        this.exec.uiActivity();
        this.seriesCollection.yLabel = this.eoc === "exceedance" ? "Return Period" : "Count";
        this.seriesCollection.yField = this.eoc === "exceedance" ? "exceedance" : "count";
        this.seriesCollection.yAxisHasChanged();
        this.exec.uiActivity();
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

        await this.updateGraph(newQuery, this.state.timePeriod, false);
    }

    public refreshGraph() {

    }

    private setEOCFromQuery(queryParams): void {
        if (queryParams.active_number) {
            if (queryParams.active_number === "count") {
                this.state.eoc = "count";
            } else {
                this.state.eoc = "exceedance";
            }
            this.eoc = this.state.eoc;
            this.eocChanged();
        }
    }

    public removeQuery(query: TimeseriesRESTQuery) {
        this.state.queries = this.state.queries.filter(i => i.__series_id !== query.__series_id);
        this.seriesCollection.removeTimeseries(query.__series_id);
        this.exec.uiActivity();
    }

    public async updateGraph(q: TimeseriesRESTQuery, timePeriod, force) {
        // Immutable copy
        const query = JSON.parse(JSON.stringify(q));
        this.updating = true;
        await this.exec.queue("update-timeseries-graph", null,
                              async () => {
                                  log.debug("Graph update from query ", query);
                                  this._changed = true;
                                  if (query.layer && (query.textSearch.length > 0 || force)) {
                                      this.emitChange();
                                      if (query.textSearch.length > 3) {
                                          // noinspection ES6MissingAwait
                                          this.auto.create(timeSeriesAutocompleteType, query.textSearch, true,
                                                           this.pref.combined.shareTextAutocompleteInGroup);
                                      }
                                      await this._updateGraphInternal(query, timePeriod);
                                  } else {
                                      log.debug("Skipped time series update, force=" + force);
                                  }
                                  this.updating = false;

                              }, query.__series_id + "-" + force, false, true, true, "inactive"
        );

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

    public async clear(empty = false) {
        log.warn("Clear called");
        if (this.defaultLayer !== null) {
            log.info("Clearing graph");
            this.state = this.defaultState();
            log.info("State is now " + this.state);
            this.seriesCollection.clear();
            this.timePeriodChanged(this.state.timePeriod);
            this.state.queries[0].regions = this.pref.combined.analyticsDefaultRegions;
            if (!empty) {
                await this._updateGraphInternal(this.state.queries[0], this.state.timePeriod);
            } else {
                this.state.queries = [];
            }
            log.warn("Clear finished");
        }

    }

    public async timePeriodChanged(timePeriod: TimePeriod) {
        this.state.timePeriod = timePeriod;
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear();
        if (timePeriod === "day") {
            this.range.controls.start.setValue(new Date(year - 1, month, day));
        } else {
            this.range.controls.start.setValue(new Date(Date.now() - dayInMillis));
        }
        this.seriesCollection.dateSpacing = timePeriod === "day" ? dayInMillis : hourInMillis;
        await this.refreshAllSeries();

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

    protected queryTransform(from: any[]): any[] {
        return from;
    }

    protected async executeQuery(query: TimeseriesRESTQuery, timePeriod: TimePeriod): Promise<any[]> {
        if (this._storeQueryInURL) {
            await this._router.navigate([], {queryParams: query});
        }

        this.updating = true;
        try {
            const payload = {
                layer: this.defaultLayer,
                ...query,
                from: this.range.controls.start.value !== null ? this.range.controls.start.value.getTime() : (nowRoundedToHour() - (365.24 * dayInMillis)),
                to:   this.range.controls.end.value !== null ? this.range.controls.end.value.getTime() : nowRoundedToHour(),
                name: "time",
                timePeriod
            };
            if (payload.regions.length === 0) {
                payload.regions = this.pref.combined.analyticsDefaultRegions;
            }
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

    private newQuery(): TimeseriesRESTQuery {
        return {
            __series_id: uuidv4(),
            regions:     [],
            textSearch:  "",
            from:        nowRoundedToHour() - (365.24 * dayInMillis),
            to:          nowRoundedToHour(),
            dateStep:    7 * dayInMillis,
            layer:       this.defaultLayer,
        };
    }

    private navigateToRoot() {
        this._router.navigate(["/analytics/time"], {queryParamsHandling: "merge"});
    }


    public showDashboard() {
        this._router.navigate(["/dashboard"]);
    }

    private defaultState(): TimeseriesAnalyticsComponentState {
        const query: TimeseriesRESTQuery = this.newQuery();
        return {eoc: this.eoc, lob: "line", queries: [this.newQuery()], timePeriod: "day"};
    }

    private async _updateGraphInternal(query, timePeriod: TimePeriod) {
        const queryResult = await this.executeQuery(query, timePeriod);
        for (const element of queryResult) {
            element.date = new Date(element.date);
        }
        if (queryResult && queryResult.length > 0) {
            this.seriesCollection.updateTimeseries(
                new TimeseriesModel(toLabel(query, this.pref.combined.layers), queryResult,
                                    query.__series_id));
        } else {
            log.warn(queryResult);
        }
    }
}
