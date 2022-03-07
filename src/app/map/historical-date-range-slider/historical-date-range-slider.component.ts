import {AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {Subscription, timer} from "rxjs";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
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
import {roundToHour, roundToMinute} from "../../common";

const log = new Logger("historical-date-range");

const MAX_HISTORICAL: number = 365 * 24 * 60 * 60 * 1000;
const MAX_CURRENT_HOUR_WINDOW: number = 30 * 24 * 60 * 60 * 1000;

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
    public height = "3vh";
    private updateTimerSub: Subscription;
    private historicalChart: XYChart;
    private error: boolean;
    private historicalSeries: ColumnSeries | LineSeries;
    private currentChart: XYChart;
    private currentSeries: ColumnSeries;
    private updateCurrentChartExtent = false;
    private updateCurrentChartSelection = false;
    private historicalDateAxis: DateAxis;
    private currentDateAxis: DateAxis;

    private currentWindowMax = 0;
    private currentWindowMin = 0;


    /**
     * These are the options for *this* component, not the ng5-slider.
     */
    private _options: DateRangeSliderOptions;
    private max: number;
    private min: any;
    private userHasInteracted: boolean = false;

    /**
     * These are the options for *this* component, not the ng5-slider.
     *
     * The ng5-slider is configured through {@link this.sliderOptions}
     */
    @Input()
    public set options(value: DateRangeSliderOptions) {
        log.debug("Options: " + JSON.stringify(value));
        const oldValue = this._options;
        this._options = JSON.parse(JSON.stringify(this._options));
        if (this._options.min <= 0) {
            console.trace("Min value must be > 0");
            log.warn("Min value must be positive");
            return;
        }
        if (this._options.max <= 0) {
            console.trace("Max value must be > 0");
            log.warn("Max value must be positive");
            return;
        }
        if (this._options.startMin <= 0) {
            console.trace("Lower value must be > 0");
            log.warn("Lower value must be > 0");
            return;
        }
        if (this._options.startMax <= 0) {
            console.trace("Lower value must be > 0");
            log.warn("Upper value must be > 0");
            return;
        }

        if (!this.userHasInteracted) {
            this.currentWindowMin = roundToHour(this._options.min);
            this.currentWindowMax = roundToMinute(this._options.max);
            this.min = roundToHour(this._options.min);
            this.max = roundToMinute(this._options.max);
        }
        if (this.historicalChart && (!this.userHasInteracted || oldValue.now !== this._options.now)) {
            this.initHistoricalSlider();
            // this.updateCurrentChartSelection= true;
        }
    }

    ngOnInit() {
        this.updateTimerSub = timer(0, 1000).subscribe(async i => {
                                                           // noinspection ES6MissingAwait
                                                           this.exec.queue("update-historical-scrollbars", null,
                                                                           async () => {
                                                                               log.debug("Checking for update");
                                                                               if (this.updateCurrentChartExtent) {
                                                                                   if (this.currentWindowMin && this.currentWindowMax) {
                                                                                       await this.getData(
                                                                                           this.currentWindowMin,
                                                                                           this.currentWindowMax,
                                                                                           ((this.currentWindowMax - this.currentWindowMin) < MAX_CURRENT_HOUR_WINDOW) ? "hour" : "day").then(
                                                                                           data => this.currentSeries.data = data);
                                                                                       this.min = this.currentWindowMin;
                                                                                       this.max = this.currentWindowMax;
                                                                                       setTimeout(() => {
                                                                                           this.currentDateAxis.zoomToDates(
                                                                                               new Date(this.min), new
                                                                                               Date(this.max), true, true);
                                                                                           this.updateCurrentChartExtent = false;
                                                                                       }, 300);
                                                                                   }
                                                                               }
                                                                               if (this.updateCurrentChartSelection && this.min && this.max) {
                                                                                   this.updateCurrentChartSelection = false;
                                                                                   log.warn("Min & Max the same ", new Date(this.min));
                                                                                   this.currentDateAxis.zoomToDates(
                                                                                       new Date(this.min), new Date(this.max),
                                                                                       true,
                                                                                       true);
                                                                                   let range: DateRange = new DateRange(this.min,
                                                                                                                        this.max);
                                                                                   log.debug("Emitting", range);
                                                                                   this.dateRange.emit(range);
                                                                               }
                                                                           }, "", true, true, true, "inactive");


                                                       }
        );
    }

    constructor(protected _zone: NgZone, protected _router: Router,
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

    private initHistoricalSlider(): void {
        this.getData(this._options.now - MAX_HISTORICAL, this._options.now, "day").then(
            data => {
                this.historicalSeries.data = data;
                setTimeout(() => {
                    this.historicalDateAxis.zoomToDates(new Date(this.currentWindowMin), new Date(this.currentWindowMax), true,
                                                        true);
                    this.updateCurrentChartExtent = true;
                    // this.updateCurrentChartSelection = true;
                    this.ready = true;
                }, 300);
            });
    }

    ngOnDestroy() {
    }

    private async createHistoricalChart() {
        this.historicalChart = am4core.create(this.historicalRef.nativeElement, am4charts.XYChart);

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

        this.historicalDateAxis.events.on("datarangechanged", (ev) => {
            this._zone.run(() => {
                if (this.ready) {
                    // this._options = {...this._options, currentWindowMin: +ev.target.minZoomed, currentWindowMax: +ev.target.maxZoomed};
                    this.currentWindowMin = roundToHour(+ev.target.minZoomed);
                    this.currentWindowMax = roundToMinute(+ev.target.maxZoomed);
                    this.updateCurrentChartExtent = true;
                    this.userHasInteracted = true;
                    this.exec.uiActivity();
                    log.debug(ev.target);
                }
            });
        });
        this.initHistoricalSlider();

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

        // dateAxis.adjustMinMax(this._options.min, this._options.max);

        this.currentDateAxis.events.on("datarangechanged", (ev) => {
            this._zone.run(() => {
                // this._options = {...this._options, currentWindowMin: +ev.target.minZoomed, currentWindowMax: +ev.target.maxZoomed};
                // tslint:disable-next-line:triple-equals
                if (this.ready && ev.target.minZoomed != ev.target.maxZoomed) {
                    this.min = roundToHour(ev.target.minZoomed);
                    this.max = roundToMinute(+ev.target.maxZoomed);
                    this.updateCurrentChartSelection = true;
                    this.exec.uiActivity();
                    this.userHasInteracted = true;
                    log.debug(this._options);
                }
            });
        });
        this.updateCurrentChartSelection = true;
    }

    private async getData(from: number, to: number, timePeriod: TimePeriod, pageSize: number = 1000): Promise<any[]> {

        // console.trace("getData: from: " + from + ", to: " + to + ", timePeriod: " + timePeriod);
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

                const serverResults = await this._api.callMapAPIWithCache(this.map + "/timeslider", payload,
                                                                          timePeriod === "day" ? 60 * 60 : 60);
                result.push(...serverResults);

                log.debug("Server result was ", serverResults);
                this.error = false;
                if (serverResults.length < pageSize) {
                    return result;
                } else {
                    payload.page++;
                }
            } while (true);
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
