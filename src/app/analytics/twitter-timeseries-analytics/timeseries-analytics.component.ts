import {Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {MetadataService} from "../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {TimeseriesCollectionModel, TimeseriesModel} from "../timeseries";
import {v4 as uuidv4} from "uuid";
import {UIExecutionService} from "../../services/uiexecution.service";
import {StateHistoryService} from "../../services/state-history.service";
import {StateHistory} from "../../../models";
import {SaveGraphDialogComponent} from "./save-graph-dialog/save-graph-dialog.component";
import {MatDialog} from "@angular/material/dialog";

const log = new Logger("twitter-timeseries");

export interface TimeseriesRESTQuery {
    dateStep?: number;
    to?: number;
    from?: number;
    location?: string;
    regions: string[];
    textSearch?: string;
    __series_id: string;
}

type TimeseriesAnalyticsComponentState = { eoc: "count" | "exceedance", lob: "line" | "bar", queries: TimeseriesRESTQuery[] };

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
    stateHistoryType = "timeseries-graph";

    ready: boolean;

    updating = false;
    noData: boolean;
    error: boolean;
    public scrollBar = true;

    public changed = new EventEmitter();
    public removable = true;
    public mappingColumns: string[] = [];
    public showForm = true;
    public connect = false;
    //     });
    public activity: boolean;
    public newQuery: TimeseriesRESTQuery;
    public seriesCollection: TimeseriesCollectionModel;
    //         this.updateGraph(this.state);
    public appToolbarExpanded = false;
    //         log.debug("The dialog was closed");
    public savedQueries: StateHistory[] = [];
    public title = "";
    protected _interval: number;
    protected _changed: boolean;
    protected _storeQueryInURL: boolean;
    /*
                                [xField]="xField"
                            [yField]="state.eoc || 'count'"
                            [yLabel]="state.eoc === 'exceedance' ? 'Days Exceeded' : 'Count'"
                            [seriesList]="(state.regions && state.regions.length) > 0 ?  state.regions : ['all']"

     */
    private interval: number;
    private graphId: string;

    constructor(public metadata: MetadataService, protected _zone: NgZone, protected _router: Router,
                protected _route: ActivatedRoute, protected _api: RESTDataAPIService, public pref: PreferenceService,
                public exec: UIExecutionService, public history: StateHistoryService, public dialog: MatDialog) {
        this.resetNewQuery();
        this.seriesCollection = new TimeseriesCollectionModel(this.xField, this.yField, this.yLabel, "Date");
        this.updateSavedQueries();
        this.ready = true;

    }

    private _type = "line";

    public get type(): string {
        return this._type;
    }

    @Input()
    public set type(value: string) {
        this._type = value;
        this.markChanged();
    }

    private _state: TimeseriesAnalyticsComponentState = {eoc: "count", lob: "line", queries: []};

    public get state(): any {
        return this._state;
    }

    @Input()
    public set state(value: any) {
        this._state = value;
        this.markChanged();
    }

    public updateSavedQueries() {
        this.history.listByOwner().then(i => this.savedQueries = i);
    }

    async ngOnInit() {
        this._route.params.subscribe(async params => {
            if (params.id) {
                this.graphId = params.id;
                const savedGraph = await this.history.get(params.id);
                this.title = savedGraph.title;
                this.state = JSON.parse(savedGraph.state);
                this.resetNewQuery();
                this.seriesCollection.clear();
                for (const query of this.state.queries) {
                    await this.updateGraph(query, true);
                }
                this.exec.uiActivity();
                this.ready = true;
            } else {
                await this.clear();
                this.ready = true;
            }
        });

    }

    public emitChange() {

        this.changed.emit(this.state);
    }

    public markChanged() {
        this._changed = true;
    }

    public ngOnDestroy(): void {
        window.clearInterval(this._interval);
    }

    public async updateGraph(q: TimeseriesRESTQuery, force) {
        // Immutable copy
        const query = JSON.parse(JSON.stringify(q));
        await this.exec.queue("update-timeseries-graph", null,
                              async () => {
                                  log.debug("Graph update from query ", query);
                                  this._changed = true;
                                  this.emitChange();
                                  if (query.textSearch.length > 0 || query.regions.length > 0 || force) {
                                      const queryResult = await this.executeQuery(query);
                                      if (queryResult && queryResult.length > 0) {
                                          this.seriesCollection.updateTimeseries(
                                              new TimeseriesModel(this.toLabel(query), queryResult,
                                                                  query.__series_id));
                                      } else {
                                          log.warn(queryResult);
                                      }
                                  } else {
                                      log.debug("Skipped time series update, force=" + force);
                                  }
                              }, query.__series_id + "-" + force, false, true, true, "inactive"
        );

    }


    saveGraph(): void {

        const dialogData = {
            dialogTitle: "Save Timeseries Graph",
            state:       this.state,
            type:        this.stateHistoryType,
            title:       this.title || ""
        };
        const dialogRef = this.dialog.open(SaveGraphDialogComponent, {
            width: "500px",
            data:  dialogData
        });

        dialogRef.afterClosed().subscribe(async result => {
            if (result !== null) {
                this.savedQueries = await this.history.listByOwner();
                if (!this.graphId) {
                    const savedGraph = await this.history.create(dialogData.type, dialogData.title, dialogData.state);
                    this.graphId = savedGraph.id;
                    this.title = dialogData.title;
                    this.updateSavedQueries();
                } else {
                    await this.history.update(this.graphId, dialogData.title, dialogData.state);
                    this.updateSavedQueries();
                }
            }
        });
    }

    public ngOnChanges(changes: SimpleChanges): void {
    }

    public async addQuery() {
        const query: TimeseriesRESTQuery = JSON.parse(JSON.stringify(this.newQuery));
        if (!this.state.queries) {
            this.state.queries = [];
        }
        log.info("Adding query ", query);
        this.state.queries.unshift(query);

        await this.updateGraph(query, true);
        this.resetNewQuery();

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
        this.resetNewQuery();
        this.state.queries = [];
        this.seriesCollection.clear();
        await this.updateGraph(this.newQuery, true);
        this.exec.uiActivity();
    }

    public graphTypeChanged(type: "bar" | "line") {
        this.exec.uiActivity();
        this.seriesCollection.graphType = type;
    }


    protected async executeQuery(query: TimeseriesRESTQuery): Promise<any[]> {
        if (this._storeQueryInURL) {
            await this._router.navigate([], {queryParams: query});
        }

        this.updating = true;
        try {
            const serverResults = await this._api.callAPI("query", {
                ...query,
                name:   "count_by_date_for_regions_and_fulltext",
                source: this.source,
                hazard: this.hazard
            });
            this.noData = serverResults.length === 0;
            this.error = false;
            return this.queryTransform(serverResults);
        } catch (e) {
            log.error(e);
            this.error = true;
            this.noData = false;
            return null;
        } finally {
            this.updating = false;
        }


        this.ready = true;
    }

    protected queryTransform(from: any[]): any[] {
        return from;
    }

    private resetNewQuery() {

        this.newQuery = {
            __series_id: uuidv4(),
            regions:     [],
            textSearch:  "",
            from:        new Date().getTime() - (365.24 * 24 * 60 * 60 * 1000),
            to:          new Date().getTime(),
            dateStep:    7 * 24 * 60 * 60 * 1000
        };
    }

    private toLabel(query: TimeseriesRESTQuery): string {
        if (query.textSearch.length === 0 && query.regions.length === 0) {
            return "all";
        }
        let label = query.textSearch;
        if (query.regions.length < 4) {
            for (const region of query.regions) {
                if (label.length !== 0) {
                    label = region + " - " + label;
                } else {
                    label = region;
                }
            }
        } else {
            if (label.length !== 0) {
                label = query.regions.length + " regions - " + label;
            } else {
                label = query.regions.length + " regions";
            }
        }

        return label;
    }
}



