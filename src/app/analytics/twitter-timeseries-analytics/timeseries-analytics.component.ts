import {Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {MetadataService} from "../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {TimeseriesCollectionModel, TimeseriesModel} from "../timeseries";
import {v4 as uuidv4} from "uuid";

const log = new Logger("twitter-timeseries");

export interface TimeseriesRESTQuery {
    dateStep?: number;
    to?: number;
    from?: number;
    location?: string;
    regions: string[];
    textSearch?: string;
}

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
    public newQuery: any = {};
    public seriesCollection: TimeseriesCollectionModel;
    //         this.updateGraph(this.state);
    public appToolbarExpanded = false;
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

    constructor(public metadata: MetadataService, protected _zone: NgZone, protected _router: Router,
                protected _route: ActivatedRoute, protected _api: RESTDataAPIService, public pref: PreferenceService) {

        this.seriesCollection = new TimeseriesCollectionModel(this.xField, this.yField, this.yLabel, "Date");
        this.resetNewQuery();
        this.updateGraph(this.newQuery);
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

    private _state: any = {eoc: "count"};

    public get state(): any {
        return this._state;
    }

    @Input()
    public set state(value: any) {
        this._state = value;
        this.markChanged();
    }

    async ngOnInit() {

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

    public async updateGraph(query: any) {
        log.debug("Graph update from query", query);
        this._changed = true;
        this.emitChange();
        this.seriesCollection.updateTimeseries(
            new TimeseriesModel(this.toLabel(query), await this.executeQuery(query), query.__series_id));
    }

    public ngOnChanges(changes: SimpleChanges): void {
    }


    // openDialog(): void {
    //     const dialogRef = this.dialog.open(TimeseriesConfigFormComponent, {
    //         width: "500px",
    //         data:  {state: this.state, component: this}
    //     });
    //
    //     dialogRef.afterClosed().subscribe(result => {
    //         log.debug("The dialog was closed");

    public async addQuery() {
        const query = JSON.parse(JSON.stringify(this.newQuery));
        this.resetNewQuery();
        if (!this.state.queries) {
            this.state.queries = [];
        }
        log.info("Adding query ", query);
        this.state.queries.push(query);

        this.seriesCollection.updateTimeseries(
            new TimeseriesModel(this.toLabel(query), await this.executeQuery(query),
                                query.__series_id));

    }

    public refreshGraph() {

    }

    public eocChanged() {
        this.seriesCollection.yLabel = this.state.eoc === "exceedance" ? "Exceedance" : "Count";
        this.seriesCollection.yField = this.state.eoc === "exceedance" ? "exceedance" : "count";
        this.seriesCollection.yAxisHasChanged();
    }

    protected async executeQuery(query: any): Promise<any[]> {
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


