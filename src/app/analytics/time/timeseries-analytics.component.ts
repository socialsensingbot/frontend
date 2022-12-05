import {Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {
    GraphType,
    StatisticType,
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
import {dayInMillis, hourInMillis, nowRoundedToHour, roundToHour} from "../../common";
import {TextAutoCompleteService} from "../../services/text-autocomplete.service";
import {SSMapLayer} from "../../types";
import {FormControl, FormGroup} from "@angular/forms";
import {MapSelectionService} from "../../map-selection.service";
import {ONE_DAY} from "../../map/data/map-data";
import {LoadingProgressService} from "../../services/loading-progress.service";

const log = new Logger("timeseries-ac");


@Component({
               selector:    "app-timeseries-analytics",
               templateUrl: "./timeseries-analytics.component.html",
               styleUrls:   ["./timeseries-analytics.component.scss"]
           })
export class TimeseriesAnalyticsComponent implements OnInit, OnDestroy, OnChanges {

    /**
     * If this is true then the current graph contains no data.
     */
    public noData = true;

    /**
     * What type of timeseries graph is being shown.
     *
     * @see GraphType
     * @private
     */
    private _type: GraphType = "line";
    private now: Date;

    public get type(): GraphType {
        return this._type;
    }

    @Input()
    public set type(value: GraphType) {
        this._type = value;
    }

    /**
     * This is the component state, when the graph is saved it's this that is saved.
     * @private
     */
    private _state: TimeseriesAnalyticsComponentState;


    public yLabel = "Return Period";
    public xField = "date";
    public yField = "exceedance";
    /**
     * Whether the timeseries graph should use animations (this is passed down to the actual graph).
     */
    public animated = false;

    /**
     * Is the graph ready to be displayed.
     */
    public ready: boolean;

    /**
     * Is the graph being updated (i.e. show spinner)
     */
    public updating = false;

    /**
     * Was there an error updating the graph.
     */
    public error: boolean;

    /**
     * Show the fancy scrollbar.
     */
    public scrollBar = true;

    /**
     * Connect missing parts of the graph
     */
    public connect = false;

    /**
     * This contains all the data relating to the display of the graph and is passed
     * to the actual graph display widget.
     */
    public seriesCollection: TimeseriesCollectionModel;

    /**
     * Internal state, has the UI's toolbar been expanded or not.
     */
    public toolbarExpanded = false;

    /**
     * A collection of graphs saved by this user.
     */
    public savedGraphs: SavedGraph[] = [];

    /**
     * The title of the currently selected graph or empty if this graph has never been saved.
     */
    public title = "";

    /**
     * The id of this graph if it has been saved.
     */
    public graphId: string;

    /**
     * The statistic type (e.g. exceedance or count)
     */
    public statType: StatisticType = "exceedance";

    public get state(): TimeseriesAnalyticsComponentState {
        return this._state;
    }

    @Input()
    public set state(value: TimeseriesAnalyticsComponentState) {
        this._state = value;
    }

    constructor(protected _zone: NgZone, protected _router: Router,
                public notify: NotificationService, public map: MapSelectionService,
                protected _route: ActivatedRoute, protected _api: RESTDataAPIService, public pref: PreferenceService,
                public exec: UIExecutionService, public saves: SavedGraphService, public dialog: MatDialog,
                public dash: DashboardService, public auto: TextAutoCompleteService, private loading: LoadingProgressService) {
        this.seriesCollection = new TimeseriesCollectionModel(this.xField, this.yField, this.yLabel, "Date");
        this.updateSavedGraphs();
        this.pref.waitUntilReady().then(() => this.dash.waitUntilReady().then(async () => {

            this.ready = true;
        }));

    }

    /**
     * The date range for this graph. Although the scrollbars allow zooming in this
     * delineates the max and min **possible** dates for the graph. I.e. this is used in the actual
     * query to retrieve the data.
     */
    public range: FormGroup = new FormGroup({
                                                start: new FormControl(new Date()),
                                                end:   new FormControl(new Date())
                                            });

    /**
     * The data layer used for this graph i.e. the source and hazards etc.
     */
    public mapLayer: SSMapLayer = null;

    public async serverNow(): Promise<number> {
        return await this._api.callMapAPIWithCache(this.map.id + "/now", {}, 60, false, true, () => false) as Promise<number>;
    }

    public updateSavedGraphs() {
        this.saves.listByOwner().then(i => this.savedGraphs = i);
    }


    public ngOnDestroy(): void {

    }

    async ngOnInit() {
        // Always wait until the preference service is ready.
        await this.pref.waitUntilReady();
        this.loading.loaded();

        /**
         * Listen for changes to the query (i.e. after ? ) part of the URL. This can be
         * changed by history navigation.
         */
        this._route.queryParams.subscribe(async queryParams => {
            if (queryParams.__clear_ui__) {
                await this.clear();
                await this._router.navigate([], {});
            }
            if (queryParams.active_layer) {
                this.mapLayer = this.pref.enabledLayers.filter(i => i.id === queryParams.active_layer)[0];
            }

        });
        /**
         * Listen to changes in the parent routes parameters, i.e. the map
         * We listen for changes to the map id which is used in all queries.
         */
        this._route.parent.params.subscribe(async params => {
            if (params.map) {
                this.map.id = params.map;
                this.now = new Date(+await this.serverNow());
                this.range.controls.end.setValue(this.now);
                this.range.controls.start.setValue(new Date(this.now.getTime() - 365 * 24 * 60 * 60 * 1000));
                this.seriesCollection.minDate = this.range.controls.start.value;
                this.seriesCollection.maxDate = this.range.controls.end.value;
                /**
                 * Listen for changes in our own routes parameters i.e. the id (which is the id of a saved graph).
                 */
                this.initGraphFromRouteParams();
            }

        });

    }

    /**
     * Clears down the entire graph, state and all.
     */
    public async clear() {
        log.debug("Clear called");
        if (this.mapLayer !== null) {
            log.debug("Clearing graph");

            // Reset the graph state
            this.state = this.defaultState();
            const query: TimeseriesRESTQuery = this.newQuery();
            log.debug("State is now ", this.state);

            // Remove all the series data from the graph.
            this.seriesCollection.clear();


            // Sets the default region in the first query this is to make sure
            // we have at least one series visible in the graph initially.
            query.regions = this.pref.combined.analyticsDefaultRegions;
            this.state.queries.push(query);

            // Reset the time period.
            await this.timePeriodChanged(this.state.timePeriod);

            // Now display the graph for that first query.
            this.noData = true;
            this.updating = true;
            await this._updateGraphInternal(query, this.state.timePeriod, () => false);
            this.updating = false;
            log.debug("Clear finished");
        }

    }

    public async dateRangeChanged(): Promise<void> {
        if (this.seriesCollection.minDate === null || (this.range.controls.start.value !== null && this.range.controls.start.value.getTime() > this.seriesCollection.minDate.getTime())) {
            this.seriesCollection.minDate = this.range.controls.start.value;
        }
        if (this.seriesCollection.maxDate === null || (this.range.controls.end.value !== null && this.range.controls.end.value.getTime() < this.seriesCollection.maxDate.getTime())) {
            this.seriesCollection.maxDate = this.range.controls.end.value;
        }
        this.seriesCollection.changeDateRange();
        await this.refreshAllSeries();
    }

    /**
     * Called to refresh (i.e. query and redisplay) each time series (this.state.queries) in the graph.
     * For example after changing the duration the graph is segmented over.
     */
    public async refreshAllSeries(): Promise<void> {
        this.updating = true;
        try {
            log.debug("Refreshing all series");
            const promisesPromises = [];
            this.noData = true;
            // This is a fork-join
            for (const query of this.state.queries) {
                if (!query.layer) {
                    query.layer = this.mapLayer;
                }
                promisesPromises.push(this.updateGraph(query, this.state.timePeriod, true));
            }
            for (const promise of promisesPromises) {
                await promise;
            }
            log.debug("Refreshed all series");
        } finally {
            this.updating = false;
        }

        // fork-join ends
    }

    public userChangedStatisticType(type: StatisticType) {
        this.statType = type;
        this.statTypeChanged();
    }

    /**
     * THhe statistic type (e.g. exceedance or count) has changed so we need to change the graph via
     * the seriesCollection model.
     */
    public statTypeChanged() {
        log.debug("Stat type changed to " + this.statType);
        this.state.eoc = this.statType;
        this.exec.uiActivity();
        this.seriesCollection.yLabel = this.statType === "exceedance" ? "Return Period" : "Count";
        this.seriesCollection.yField = this.statType === "exceedance" ? "exceedance" : "count";
        this.seriesCollection.yAxisHasChanged();
        this.exec.uiActivity();
    }

    /**
     * Either save or duplicate this graph.
     * If duplicate is true create a new graph with this state and a different id.
     * @param duplicate {boolean} If true, create a new graph if false save the existing graph.
     *
     */
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

                    const savedGraph = await this.saves.create("timeseries-graph", dialogData.title, this.state);
                    this.graphId = savedGraph.id;
                    this.title = dialogData.title;
                    this.updateSavedGraphs();
                    await this._router.navigate(["/map/" + this.map.id + "/analytics/time/" + this.graphId],
                                                {queryParamsHandling: "preserve"});

                }
            });
        } else {
            this.updating = true;
            try {
                await this.saves.update(this.graphId, this.title, this.state);
                this.updateSavedGraphs();
                this.notify.show("Saved graph '" + this.title + "'", "Great!", 4000);
            } finally {
                this.updating = false;
            }
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
    }

    /**
     * Adds a new blank query to the queries in the graph's state.
     * Each query produces a separate series on the resulting graph.
     */
    public async addQuery() {

        if (!this.state.queries) {
            this.state.queries = [];
        }

        const newQuery = this.newQuery();
        log.info("Adding query ", newQuery);
        this.state.queries.unshift(newQuery);

        this.updating = true;
        await this.updateGraph(newQuery, this.state.timePeriod, false);
        this.updating = false;
    }

    public refreshGraph() {

    }

    public async timePeriodChanged(timePeriod: TimePeriod) {
        const switchedToHours = timePeriod === "hour";

        log.debug("Time period was " + timePeriod);
        log.debug("Time period is now " + timePeriod);
        this.state.timePeriod = timePeriod;
        const today = this.now;
        const day = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear();
        let minDate: Date;
        let maxDate: Date;
        if (switchedToHours) {
            minDate = this.seriesCollection.minScrollbarDate ? this.seriesCollection.minScrollbarDate : new Date(
                this.now.getTime() - ONE_DAY);
            maxDate = this.seriesCollection.maxScrollbarDate ? this.seriesCollection.maxScrollbarDate : this.now;
            log.debug("Min date is now " + minDate);
            log.debug("Max date is now " + maxDate);
        } else {
            minDate = new Date(year - 1, month, day);
            maxDate = this.now;
        }
        this.range.controls.start.setValue(minDate);
        this.range.controls.end.setValue(maxDate);
        this.seriesCollection.dateSpacing = timePeriod === "day" ? dayInMillis : hourInMillis;
        this.seriesCollection.minDate = minDate;
        this.seriesCollection.maxDate = maxDate;
        this.seriesCollection.rangeChanged.emit();

        await this.refreshAllSeries();

    }

    /**
     * Removes a query, it's series and all it's state from the graph.
     * @param query
     */
    public removeQuery(query: TimeseriesRESTQuery) {
        // Remove the query
        this.state.queries = this.state.queries.filter(i => i.__series_id !== query.__series_id);
        // Remove it's associated series
        this.seriesCollection.removeTimeseries(query.__series_id);

        // This counts as UI activity i.e. prevents new queries from being run for a few secs.
        this.exec.uiActivity();
    }

    public async updateGraph(q: TimeseriesRESTQuery, timePeriod, force): Promise<any> {
        log.debug("updateGraph");
        // console.trace("timeseries updateGraph");
        // noinspection ES6MissingAwait
        return this.exec.queue("update-timeseries-graph", null, async (interrupted: () => boolean) => {
            // Immutable copy
            const query = JSON.parse(JSON.stringify(q)) as TimeseriesRESTQuery;
            log.debug("Graph update from query ", query);
            const text: string = query.textSearch;
            if (query.layer && (text.length > 0 || force)) {
                if (text.length > 3) {
                    // noinspection ES6MissingAwait
                    this.auto.create(timeSeriesAutocompleteType, text, true,
                                     this.pref.combined.shareTextAutocompleteInGroup);
                }
                // No need to do an await here as we want async execution
                // the await needs to be called on the result of this function updateGraph()
                // noinspection ES6MissingAwait
                await this._updateGraphInternal(query, timePeriod, interrupted);
            } else {
                log.debug("Skipped time series update, force=" + force);
            }

        }, q.__series_id + "-" + force, true, true, true, true, "inactive", 100, 100000);

    }

    public graphTypeChanged(type: GraphType) {
        this.exec.uiActivity();
        this.seriesCollection.graphType = type;
    }

    public async deleteSavedGraph(id: string) {
        await this.saves.delete(id);
        if (id === this.graphId) {
            this.navigateToRoot();
        }
    }

    protected async executeQuery(query: TimeseriesRESTQuery, timePeriod: TimePeriod, interrupted: () => boolean): Promise<any[]> {

        if (!this.map.id) {
            return;
        }

        try {
            let endDate: any = this.range.controls.end.value !== null ? roundToHour(
                this.range.controls.end.value.getTime()) : nowRoundedToHour();
            let startDate: any = this.range.controls.start.value !== null ? roundToHour(
                this.range.controls.start.value.getTime()) : (nowRoundedToHour() - (365.24 * dayInMillis));
            const payload: any = {
                ...query.layer,
                location: query.location,
                regions:  query.regions,

                startDate: startDate,
                endDate:   endDate,
                name:      "time",
                timePeriod
            };
            if (query.textSearch) {
                payload.textSearch = query.textSearch;
            }
            if (payload.regions.length === 0) {
                payload.regions = this.pref.combined.analyticsDefaultRegions;
            }
            const serverResults = await this._api.callMapAPIWithCache(this.map.id + "/analytics/time",
                                                                      payload, 60 * 60 * 24, false,
                                                                      true,
                                                                      interrupted);
            log.debug("Server result was ", serverResults);
            this.error = false;
            return this.queryTransform(serverResults);
        } catch (e) {
            log.error(e);
            this.error = true;
            return null;
        }

    }

    private initGraphFromRouteParams(): void {
        this._route.params.subscribe(async params => {
            this.noData = true;
            this.updating = true;
            try {
                const queryParams = this._route.snapshot.queryParams;
                if (queryParams.active_layer) {
                    this.mapLayer = this.pref.enabledLayers.filter(i => i.id === queryParams.active_layer)[0];
                } else {
                    this.mapLayer = this.pref.defaultLayer();
                }

                log.info("State is now " + JSON.stringify(this.state));
                if (params.id) {
                    // We need to load a saved graph
                    this.state = this.defaultState();
                    this.seriesCollection.clear();
                    this.setEOCFromQuery(queryParams);
                    this.graphId = params.id;
                    const savedGraph = await this.saves.get(params.id);
                    if (savedGraph !== null) {
                        this.title = savedGraph.title;
                        this.state = JSON.parse(savedGraph.state);
                        await this.timePeriodChanged(this.state.timePeriod || "day");
                        log.debug("Loaded saved graph with state ", this.state);
                        await this.refreshAllSeries();
                        // this.exec.uiActivity();
                    } else {
                        this.navigateToRoot();
                    }
                } else {
                    // This is a new (unsaved) graph.
                    this.graphId = null;
                    this.title = "";
                    if (typeof queryParams.text_search !== "undefined") {
                        this.state.queries[0].textSearch = queryParams.text_search;
                    }
                    // We don't support coarse or fine region types as they are numeric (grid) based.
                    // The selected region can be passed in from other parts of the app such as the map.
                    if (typeof queryParams.selected !== "undefined" && queryParams.active_polygon !== "coarse" && queryParams.active_polygon !== "fine") {
                        log.debug("Taking the selected region from the query ", queryParams.selected);
                        this.state = this.defaultState();
                        log.debug("State is now ", JSON.stringify(this.state));
                        if (Array.isArray(queryParams.selected)) {
                            log.debug("Regions selected: ", JSON.stringify(queryParams.selected));
                            for (const region of queryParams.selected) {
                                try {
                                    log.debug("Adding query for region " + region);
                                    const newQuery = this.newQuery();
                                    newQuery.regions.push(region);
                                    this.state.queries.push(newQuery);
                                    await this.updateGraph(newQuery, this.state.timePeriod, true);
                                } catch (e) {
                                    console.error(e);
                                }

                            }
                            log.debug("State is now ", JSON.stringify(this.state));
                        } else {
                            const newQuery: TimeseriesRESTQuery = this.newQuery();
                            this.state.queries = [newQuery];
                            newQuery.regions = [queryParams.selected];
                            log.debug("State is now ", JSON.stringify(this.state));
                            await this.updateGraph(newQuery, this.state.timePeriod, true);
                        }
                        log.debug("State is now ", JSON.stringify(this.state));
                        this.setEOCFromQuery(queryParams);
                    } else {
                        // No region is selected or a numeric region is selected.
                        await this.clear();
                        this.state.queries[0].regions = this.pref.combined.analyticsDefaultRegions;
                        this.setEOCFromQuery(queryParams);
                        await this.updateGraph(this.state.queries[0], this.state.timePeriod, true);

                    }
                }
            } finally {
                this.updating = false;
            }

        });
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
                this.state.from = this.range.controls.start.value.getTime();
                this.state.to = this.range.controls.end.value.getTime();
                await this.dash.addCard("timeseries", dialogData.title,
                                        1, 1, this.state);
                this.showDashboard();
            }
        });


    }

    protected queryTransform(from: any[]): any[] {
        return from;
    }

    public showDashboard() {
        this._router.navigate(["map", this.map.id, "dashboard"]);
    }

    private setEOCFromQuery(queryParams): void {
        if (queryParams.active_number) {
            if (queryParams.active_number === "count") {
                this.state.eoc = "count";
            } else {
                this.state.eoc = "exceedance";
            }
            this.statType = this.state.eoc;
            this.statTypeChanged();
        }
    }

    public async formChanged(query: TimeseriesRESTQuery) {
        this.updating = true;
        if (this.state.queries.length === 1) {
            this.noData = true;
        }
        try {
            await this.updateGraph(query, this.state.timePeriod, true);
        } finally {
            this.updating = false;
            this.exec.uiActivity();
        }
    }

    private navigateToRoot() {
        this._router.navigate(["map", this.map.id, "analytics", "time"], {queryParamsHandling: "merge"});
    }

    private defaultState(): TimeseriesAnalyticsComponentState {
        return {eoc: this.statType, lob: "line", queries: [], timePeriod: "day"};
    }

    private async _updateGraphInternal(query, timePeriod: TimePeriod, interrupted: () => boolean) {
        log.debug("_updateGraphInternal() called");
        return this.executeQuery(query, timePeriod, interrupted).then(queryResult => {
            if (queryResult && queryResult.length === 0) {
                log.info("No data returned from query");
            } else {
                log.info("Data returned from query", queryResult);
                this.noData = false;

            }
            if (queryResult === null) {
                log.error("Null result from updateGraphInternal query.");
            } else {
                for (const element of queryResult) {
                    element.date = new Date(element.date);
                }
                if (queryResult && queryResult.length > 0) {
                    log.debug("Updating time series.");
                    this.seriesCollection.updateTimeseries(
                        new TimeseriesModel(toLabel(query, this.pref.combined.layers), queryResult,
                                            query.__series_id));
                } else {
                    log.warn(queryResult);
                    this.seriesCollection.updateTimeseries(
                        new TimeseriesModel(toLabel(query, this.pref.combined.layers), [],
                                            query.__series_id));
                }
            }
            log.debug("_updateGraphInternal() finished");
        }).catch(e => log.error(e));
    }

    private newQuery(): TimeseriesRESTQuery {
        return {
            __series_id: uuidv4(),
            regions:     [],
            textSearch:  "",
            from:        nowRoundedToHour() - (365.24 * dayInMillis),
            to:          nowRoundedToHour(),
            dateStep:    7 * dayInMillis,
            layer:       this.mapLayer,
        };
    }
}
