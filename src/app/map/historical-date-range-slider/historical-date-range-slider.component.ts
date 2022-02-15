import {AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {ChangeContext} from "ng5-slider";
import {Subscription, timer} from "rxjs";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import {roundToHour} from "../../common";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import {ColumnSeries, DateAxis, LineSeries, XYChart, XYChartScrollbar} from "@amcharts/amcharts4/charts";
import jt_theme from "../../theme/jt.theme";
import {MetadataService} from "../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {NotificationService} from "../../services/notification.service";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {UIExecutionService} from "../../services/uiexecution.service";
import {TextAutoCompleteService} from "../../services/text-autocomplete.service";
import {TimePeriod, TimeseriesRESTQuery} from "../../analytics/timeseries";
import {SSMapLayer} from "../../types";
import {DateRangeSliderOptions} from "../types";

const log = new Logger("historical-date-range");

const MAX_HISTORICAL_WINDOW: number = 60 * 24 * 60 * 60 * 1000;
const MAX_CURRENT_HOUR_WINDOW: number = 7 * 24 * 60 * 60 * 1000;
const INITIAL_HISTORICAL_WINDOW: number = 30 * 24 * 60 * 60 * 1000;
const MAX_CURRENT_WINDOW: number = 7 * 24 * 60 * 60 * 1000;

@Component({
               selector:    "app-historical-date-range-slider",
               templateUrl: "./historical-date-range-slider.component.html",
               styleUrls:   ["./historical-date-range-slider.component.scss"]
           })

/**
 * This component provides a date range slider which periodically emits change
 * events.
 */
export class HistoricalDateRangeSliderComponent implements OnInit, OnDestroy, AfterViewInit {


    @ViewChild("historicalScrollbar") historicalRef: ElementRef;
    @ViewChild("currentScrollbar") currentRef: ElementRef;


    /**
     * This is the output of the component and will emit date ranges
     * when the the slider value changes. Changes are throttled.
     */
    @Output() dateRange = new EventEmitter<DateRange>();
    /** Used to trigger manual refresh of the labels */
    public refresh: EventEmitter<void> = new EventEmitter<void>();
    @Input()
    public query: TimeseriesRESTQuery;
    @Input()
    public layer: string;
    @Input()
    public regions: string[] = [];
    @Input()
    public map: string;
    public ready = false;
    public height: string = "3vh";
    private updateTimerSub: Subscription;
    private historicalChart: XYChart;
    private error: boolean;
    private historicalSeries: ColumnSeries | LineSeries;
    private data: any[];
    private currentChart: XYChart;
    private currentSeries: ColumnSeries;
    private updateCurrentChartExtent: boolean = true;
    private updateCurrentChartSelection: boolean = true;
    private historicalDateAxis: DateAxis;
    private currentDateAxis: DateAxis;

    private _lowerValue = -1;

    public get lowerValue(): number {
        return this._lowerValue;
    }

    /**
     * This is called when the user slides the lower range on the slider.
     *
     * @param value the offset in minutes (a negative number)
     */
    public set lowerValue(value: number) {
        log.debug("Lower value changed to " + value);

        if (typeof value === "undefined") {
            log.debug("Undefined lower value");
        }
        this._lowerValue = value;
    }

    private _upperValue = 0;

    public get upperValue(): number {
        return this._upperValue;
    }

    /**
     * This is called when the user slides the upper range on the slider.
     *
     * @param value the offset in minutes (a negative number)
     */
    public set upperValue(value: number) {
        log.debug("Upper value changed to " + value);
        if (typeof value === "undefined") {
            log.debug("Undefined upper value");
        }
        this._upperValue = value;

    }

    /**
     * These are the options for *this* component, not the ng5-slider.
     */
    private _options: DateRangeSliderOptions;

    /**
     * These are the options for *this* component, not the ng5-slider.
     *
     * The ng5-slider is configured through {@link this.sliderOptions}
     */
    @Input()
    public set options(value: DateRangeSliderOptions) {
        log.debug("Options: " + JSON.stringify(value));
        const oldValue = this._options;
        this._options = value;
        if (value.min <= 0) {
            throw new Error("Min value must be positive");
        }
        if (value.max <= 0) {
            throw new Error("Max value must be positive");
        }
        if (value.currentWindowMin < 0) {
            throw new Error("Current Window Lower value must be positive");
        }
        if (value.currentWindowMax < 0) {
            throw new Error("Current Window Upper value must be positive");
        }
        if (value.startMin <= 0) {
            throw new Error("Lower value must be > 0");
        }
        if (value.startMax <= 0) {
            throw new Error("Upper value must be > 0");
        }
        if (this._options.currentWindowMin === 0) {
            this._options.currentWindowMax = value.max;
            this._options.currentWindowMin = value.max - INITIAL_HISTORICAL_WINDOW;

        }
        if (this._options.currentWindowMax - this._options.currentWindowMin > INITIAL_HISTORICAL_WINDOW) {
            this._options.currentWindowMin = this._options.currentWindowMax - INITIAL_HISTORICAL_WINDOW;
        }
        if (this.historicalChart && (!oldValue || oldValue.min !== value.min || oldValue.max !== value.max)) {
            this.getData(roundToHour(this._options.min), roundToHour(this._options.max), "day").then(
                data => this.historicalChart.data = data);
            this.zoomHistorical();

        }
    }

    constructor(public metadata: MetadataService, protected _zone: NgZone, protected _router: Router,
                public notify: NotificationService,
                private _route: ActivatedRoute, private _api: RESTDataAPIService, public pref: PreferenceService,
                public exec: UIExecutionService,
                public auto: TextAutoCompleteService,) {
    }

    public ngAfterViewInit(): void {
        // am4core.useTheme(am4themes_animated);
        // log.debug("data: " + JSON.stringify(data));
        try {
            if (this.historicalRef && this.historicalRef.nativeElement) {
                this._zone.runOutsideAngular(async () => {
                    /* Chart code */
                    // Themes begin
                    am4core.useTheme(jt_theme);
                    // am4core.useTheme(am4themes_animated);
                    // Themes end
                    await this.createCurrentChart();
                    await this.createHistoricalChart();
                });

            }
        } catch (e) {
            log.error(e);
        }


    }

    ngOnInit() {
        this.updateTimerSub = timer(0, 1000).subscribe(i => {
                                                           log.debug("Checking for update");
                                                           if (this.updateCurrentChartExtent) {
                                                               this.updateCurrentChartExtent = false;
                                                               if (this._options.currentWindowMin && this._options.currentWindowMax) {
                                                                   this.getData(roundToHour(this._options.currentWindowMin),
                                                                                roundToHour(this._options.currentWindowMax),
                                                                                this._options.currentWindowMax - this._options.currentWindowMin < MAX_CURRENT_HOUR_WINDOW ? "hour" : "day").then(
                                                                       data => this.currentChart.data = data);
                                                               }
                                                           }
                                                           if (this.updateCurrentChartSelection) {
                                                               this.updateCurrentChartSelection = false;
                                                               if (this._options.min && this._options.max) {
                                                                   this.dateRange.emit(new DateRange(this._options.min, this._options.max))
                                                               }
                                                           }
                                                       }
        );
    }

    ngOnDestroy() {
    }

    public changeEvent($event: ChangeContext) {
        log.debug("changeEvent()");
        if (this.ready) {
            this.dateRange.emit(new DateRange(this._lowerValue, this._upperValue));
        }
    }

    private async createHistoricalChart() {
        this.historicalChart = am4core.create(this.historicalRef.nativeElement, am4charts.XYChart);
        // const dataPromise = this.getData(roundToHour(this._options.min), roundToHour(this._options.max), "day").then(
        //     data => {
        //         this.historicalChart.data = data;
        //         this.historicalChart.events.on("ready", () => {
        //             this.zoomHistorical();
        //         });
        //     });

        this.historicalDateAxis = this.historicalChart.xAxes.push(new am4charts.DateAxis());
        (this.historicalDateAxis.dataFields as any).category = "Date";
        this.historicalDateAxis.renderer.grid.template.location = 0.5;
        // dateAxis.dateFormatter.inputDateFormat = "yyyy-MM-dd";
        this.historicalDateAxis.renderer.minGridDistance = 50;

        const valueAxis = this.historicalChart.yAxes.push(new am4charts.ValueAxis());

        this.historicalSeries = this.historicalChart.series.push(new am4charts.ColumnSeries());
        this.historicalSeries.dataFields.valueY = "count";
        this.historicalSeries.dataFields.dateX = "date";
        this.historicalSeries.strokeWidth = 2;
        this.historicalSeries.minBulletDistance = 10;
        this.historicalSeries.showOnInit = false;

        // this.series.tensionX = 0.95;
        // this.series.connect = false;

        this.historicalChart.scrollbarX = new am4charts.XYChartScrollbar();
        (this.historicalChart.scrollbarX as XYChartScrollbar).series.push(this.historicalSeries);


        this.historicalChart.plotContainer.visible = false;
        this.historicalChart.leftAxesContainer.visible = false;
        this.historicalChart.rightAxesContainer.visible = false;
        this.historicalChart.bottomAxesContainer.visible = false;
        const dateAxisChangedStart = (ev) => {
            this._zone.run(() => {
                // this._options = {...this._options, currentWindowMin: +ev.target.minZoomed, currentWindowMax: +ev.target.maxZoomed};
                let min: number = +ev.target.minZoomed;
                let max: number = +ev.target.maxZoomed;
                // if (max - min > MAX_HISTORICAL_WINDOW) {
                //     min = max - MAX_HISTORICAL_WINDOW;
                //     this.historicalDateAxis.zoomToDates(new Date(min), new Date(max), true, true);
                // }
                if (this._options) {
                    this._options.currentWindowMin = min;
                    this._options.currentWindowMax = max;
                }
                this.updateCurrentChartExtent = true;
                log.debug(this._options);
            });
        };
        // dateAxis.adjustMinMax(this._options.min, this._options.max);

        this.historicalDateAxis.events.on("datarangechanged", dateAxisChangedStart);
    }

    private zoomHistorical<T>(): void {
        setTimeout(() => {
            // this.historicalDateAxis.adjustMinMax(this._options.min, this._options.max);
            if (this._options.currentWindowMax - this._options.currentWindowMin > MAX_HISTORICAL_WINDOW) {
                this._options.currentWindowMin = this._options.currentWindowMax - MAX_HISTORICAL_WINDOW;
            }
            this.historicalDateAxis.zoomToDates(new Date(this._options.currentWindowMin), new Date(this._options.currentWindowMax), false,
                                                false);

        }, 300);
    }

    private async createCurrentChart() {
        this.currentChart = am4core.create(this.currentRef.nativeElement, am4charts.XYChart);
        this.currentDateAxis = this.currentChart.xAxes.push(new am4charts.DateAxis());
        (this.currentDateAxis.dataFields as any).category = "Date";
        this.currentDateAxis.renderer.grid.template.location = 0.5;
        // dateAxis.dateFormatter.inputDateFormat = "yyyy-MM-dd";
        this.currentDateAxis.renderer.minGridDistance = 50;

        const valueAxis = this.currentChart.yAxes.push(new am4charts.ValueAxis());

        this.currentSeries = this.currentChart.series.push(new am4charts.ColumnSeries());
        this.currentSeries.dataFields.valueY = "count";
        this.currentSeries.dataFields.dateX = "date";
        this.currentSeries.strokeWidth = 2;
        this.currentSeries.minBulletDistance = 10;

        // this.series.tensionX = 0.95;
        // this.series.connect = false;

        this.currentChart.scrollbarX = new am4charts.XYChartScrollbar();
        (this.currentChart.scrollbarX as XYChartScrollbar).series.push(this.currentSeries);


        this.currentChart.plotContainer.visible = false;
        this.currentChart.leftAxesContainer.visible = false;
        this.currentChart.rightAxesContainer.visible = false;
        this.currentChart.bottomAxesContainer.visible = false;

        const dateAxisChangedStart = (ev) => {
            this._zone.run(() => {
                // this._options = {...this._options, currentWindowMin: +ev.target.minZoomed, currentWindowMax: +ev.target.maxZoomed};
                let min: number = ev.target.minZoomed;
                let max: number = +ev.target.maxZoomed;
                // if (max - min > MAX_CURRENT_WINDOW) {
                //     min = max - MAX_CURRENT_WINDOW;
                //     this.currentDateAxis.zoomToDates(new Date(min), new Date(max), true, true);
                // }
                this._options = {...this._options, min, max};
                this.updateCurrentChartSelection = true;
                log.debug(this._options);
            });
        };
        // dateAxis.adjustMinMax(this._options.min, this._options.max);

        this.currentDateAxis.events.on("datarangechanged", dateAxisChangedStart);
    }

    private async getData(from: number, to: number, timePeriod: TimePeriod, pageSize: number = 100): Promise<any[]> {

        console.trace("getData: from: " + from + ", to: " + to + ", timePeriod: " + timePeriod);
        try {

            await this.pref.waitUntilReady();
            const layer: SSMapLayer = this.pref.enabledLayers.filter(i => i.id === this.layer)[0];
            log.debug(this.layer);
            log.debug(layer);
            const result = [];
            const payload: TimeseriesRESTQuery = {
                    layer,
                    dateStep:   -1,
                    regions:    this.regions,
                    location:   "",
                    textSearch: "",
                    timePeriod,
                    pageSize,
                    page:       0,
                    from,
                    to

                }
            ;
            if (payload.regions.length === 0) {
                payload.regions = this.pref.combined.analyticsDefaultRegions;
            }
            do {

                const serverResults = await this._api.callMapAPIWithCache(this.map + "/timeslider", payload, 60);
                result.push(...serverResults);

                log.debug("Server result was ", serverResults);
                this.error = false;
                if (serverResults.length < pageSize) {
                    return result;
                } else {
                    payload.page++;
                }
            } while (true)
        } catch (e) {
            log.error(e);
            this.error = true;
            return null;
        }
    }


}


export class DateRange {
    constructor(public lower: number, public upper: number) {

    }

}
