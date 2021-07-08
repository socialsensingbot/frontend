import {
    Component,
    EventEmitter,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from "@angular/core";
import {StandardGraphComponent} from "../../standard-graph-component";
import {MetadataService} from "../../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {HistoricalDataService} from "../../../api/historical-data.service";
import {MatDialog} from "@angular/material/dialog";

@Component({
               selector:    "app-twitter-timeseries",
               templateUrl: "./twitter-timeseries.component.html",
               styleUrls:   ["./twitter-timeseries.component.scss"]
           })
export class TwitterTimeseriesComponent extends StandardGraphComponent implements OnInit, OnDestroy, OnChanges {
    @Input()
    public height: number;
    @Input()
    public dateRangeFilter: boolean;
    @Input()
    public regionFilter: boolean;
    @Input()
    public textFilter: boolean;
    @Input()
    public source = "twitter";
    @Input()
    public hazard = "flood";
    @Input()
    public yLabel = "Count";
    @Input()
    public xField = "date";
    @Input()
    public yField = "count";
    @Input()
    public animated = false;

    @Input() scrollBar = true;
    @Input()
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
    @Output()
    public changed = new EventEmitter();
    public removable = true;
    @Input()
    public mappingColumns: string[] = [];
    // }
    @Input()
    public showForm: boolean = true;
    @Input() connect = false;
    private interval: number;

    constructor(metadata: MetadataService, zone: NgZone, router: Router, route: ActivatedRoute,
                _api: HistoricalDataService, public dialog: MatDialog) {
        super(metadata, zone, router, route, _api, "count_by_date_for_regions_and_fulltext", false);
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

    private _state: any = {};

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
        this._interval = this.startChangeTimer();
        if (!this.textFilter) {
            this.restQueryName = "count_by_date_for_regions";
        }
        if (!this.textFilter && !this.regionFilter) {
            this.restQueryName = "count_by_date_for_all_regions";
        }


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
        console.log("Graph update from state", state);
        this.query = {...this.query, regions: state.regions, textSearch: state.textSearch};
        this._changed = true;
        this.emitChange();
    }


    // openDialog(): void {
    //     const dialogRef = this.dialog.open(TimeseriesConfigFormComponent, {
    //         width: "500px",
    //         data:  {state: this.state, component: this}
    //     });
    //
    //     dialogRef.afterClosed().subscribe(result => {
    //         console.log("The dialog was closed");
    //         this.updateGraph(this.state);
    //     });

    public ngOnChanges(changes: SimpleChanges): void {
    }


}


