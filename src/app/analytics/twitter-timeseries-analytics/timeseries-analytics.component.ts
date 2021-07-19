import {Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {MetadataService} from "../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";

const log = new Logger("twitter-timeseries");

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
    public query: {
        dateStep?: number;
        to?: number;
        from?: number;
        location?: string;
        regions: string[];
        textSearch?: string;
    } = {
        regions:  [],
        from:     new Date().getTime() - (365.24 * 24 * 60 * 60 * 1000),
        to:       new Date().getTime(),
        dateStep: 7 * 24 * 60 * 60 * 1000
    };
    public changed = new EventEmitter();
    public removable = true;
    public mappingColumns: string[] = [];
    public showForm = true;
    public connect = false;
    //     });
    public activity: boolean;
    public newQuery: any = {};
    protected _interval: number;
    protected _changed: boolean;
    protected _storeQueryInURL: boolean;
    private interval: number;
    public queryMap: { [label: string]: any[] } = {};

    constructor(public metadata: MetadataService, protected _zone: NgZone, protected _router: Router,
                protected _route: ActivatedRoute, protected _api: RESTDataAPIService, public pref: PreferenceService) {

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
        this.query = {...this.query, ...value};
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

    public async updateGraph(state: any) {
        log.debug("Graph update from state", state);
        this.query = {...this.query, regions: state.regions, textSearch: state.textSearch};
        this._changed = true;
        this.emitChange();
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
    //         this.updateGraph(this.state);

    public async addQuery() {
        if (this.state.queries) {
            this.state.queries.push(this.newQuery);
        } else {
            this.state.queries = [this.newQuery];
        }


        this.queryMap[this.toLabel(this.newQuery)] = await this.executeQuery(this.newQuery);
    }


    protected async executeQuery(query: any): Promise<any[]> {
        if (this._storeQueryInURL) {
            await this._router.navigate([], {queryParams: this.query});
        }
        this.ready = false;
        this._changed = false;
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

    private toLabel(query: any):string {
        let label = query.textSearch;
        for (const region of query.regions) {
            label = region + "-" + label;
        }
        return label;
    }
}


