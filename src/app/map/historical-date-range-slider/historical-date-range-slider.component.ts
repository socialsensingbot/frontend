import {AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {Subscription, timer} from "rxjs";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../pref/preference.service";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import {ColumnSeries, DateAxis, LineSeries, XYChart, XYChartScrollbar} from "@amcharts/amcharts4/charts";
import jt_theme from "../../theme/jt.theme";
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
const MAX_CURRENT_EXTENT: number = 30 * 24 * 60 * 60 * 1000;
const MAX_CURRENT_WINDOW: number = 7 * 24 * 60 * 60 * 1000;
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
    private updateLayer: boolean;
    private userHasInteracted = false;

    private _query: TimeseriesRESTQuery;

    @Input()
    public get query(): TimeseriesRESTQuery {
        return this._query;
    }

    public set query(value: TimeseriesRESTQuery) {
        this._query = value;
    }


    @ViewChild("historicalScrollbar") historicalRef: ElementRef;
    @ViewChild("currentScrollbar") currentRef: ElementRef;


    /**
     * This is the output of the component and will emit date ranges
     * when the the slider value changes. Changes are throttled.
     */
    @Output() dateRange = new EventEmitter<DateRange>();
    /** Used to trigger manual refresh of the labels */
    public refresh: EventEmitter<void> = new EventEmitter<void>();

    private _layer: string;

    public get layer(): string {
        return this._layer;
    }

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
    private min: number;

    @Input()
    public set layer(value: string) {
        this._layer = value;
        this.updateLayer = true;
    }

    /**
     * These are the options for *this* component, not the ng5-slider.
     *
     * The ng5-slider is configured through {@link this.sliderOptions}
     */
    @Input()
    public set options(value: DateRangeSliderOptions) {
        log.debug("Options: " + JSON.stringify(value));
        const oldValue = this._options;
        this._options = JSON.parse(JSON.stringify(value));
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
        this.updateTimerSub = timer(0, 300).subscribe(async i => {
                                                          // noinspection ES6MissingAwait
                                                          this.exec.queue("update-historical-scrollbars", null,
                                                                          async (interrupted: () => boolean) => {
                                                                              log.verbose("Checking for update");
                                                                              if (this.updateLayer) {
                                                                                  this.updateLayer = false;
                                                                                  if (this.currentWindowMin && this.currentWindowMax) {
                                                                                      await this.getData(
                                                                                          this.currentWindowMin,
                                                                                          this.currentWindowMax,
                                                                                          ((this.currentWindowMax - this.currentWindowMin) < MAX_CURRENT_HOUR_WINDOW) ? "hour" : "day").then(
                                                                                          data => this.currentSeries.data = data);
                                                                                      await this.getData(
                                                                                          this._options.now - MAX_HISTORICAL,
                                                                                          this._options.now, "day", 100, interrupted).then(
                                                                                          data => {
                                                                                              if (data !== null) {this.historicalSeries.data = data;}
                                                                                          });
                                                                                  }
                                                                              }
                                                                              if (this.updateCurrentChartExtent) {
                                                                                  this.updateCurrentChartExtent = false;
                                                                                  if (this.currentWindowMin && this.currentWindowMax) {
                                                                                      await this.getData(
                                                                                          this.currentWindowMin,
                                                                                          this.currentWindowMax,
                                                                                          ((this.currentWindowMax - this.currentWindowMin) < MAX_CURRENT_HOUR_WINDOW) ? "hour" : "day").then(
                                                                                          data => {
                                                                                              if (data !== null) {this.currentSeries.data = data;}
                                                                                          });
                                                                                      this.min = this.currentWindowMin;
                                                                                      this.max = this.currentWindowMax;
                                                                                      this.updateCurrentChartSelection = true;
                                                                                      log.warn(
                                                                                          "updateCurrentChartExtent Min & Max =" + new Date(
                                                                                              this.min) + " -> " + new Date(this.max));
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
                                                                                  log.warn(
                                                                                      "updateCurrentChartSelection Min & Max =" + new Date(
                                                                                          this.min) + " -> " + new Date(this.max));
                                                                                  setTimeout(() => {
                                                                                      this.currentDateAxis.zoomToDates(
                                                                                          new Date(this.min), new Date(this.max),
                                                                                          true,
                                                                                          true);
                                                                                  }, 300);
                                                                                  const range: DateRange = new DateRange(this.min,
                                                                                                                         this.max);
                                                                                  log.debug("Emitting", range);
                                                                                  this.dateRange.emit(range);
                                                                              }
                                                                          }, "", true, true, true, true, "inactive", 100, 10000);


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
            if (ev.target.maxZoomed - ev.target.minZoomed > MAX_CURRENT_EXTENT) {
                if (ev.target.maxZoomed !== this.currentWindowMax) {
                    this.historicalDateAxis.zoomToDates(new Date(ev.target.maxZoomed - MAX_CURRENT_EXTENT),
                                                        new Date(ev.target.maxZoomed), true, true);
                } else {
                    this.historicalDateAxis.zoomToDates(new Date(ev.target.minZoomed),
                                                        new Date(ev.target.minZoomed + MAX_CURRENT_EXTENT), true, true);
                }
            }
            this._zone.run(() => {
                if (ev.target.maxZoomed - ev.target.minZoomed > MAX_CURRENT_EXTENT) {
                    if (ev.target.maxZoomed !== this.currentWindowMax) {
                        this.currentWindowMin = ev.target.maxZoomed - MAX_CURRENT_EXTENT;
                        this.currentWindowMax = ev.target.maxZoomed;
                    } else {
                        this.currentWindowMin = ev.target.minZoomed;
                        this.currentWindowMax = ev.target.minZoomed + MAX_CURRENT_EXTENT;

                    }
                } else {
                    this.currentWindowMin = ev.target.minZoomed;
                    this.currentWindowMax = ev.target.maxZoomed;

                }
                if (this.ready) {
                    // this._options = {...this._options, currentWindowMin: +ev.target.minZoomed, currentWindowMax: +ev.target.maxZoomed};
                    log.debug("Historical Date Range Changed, event = ", ev);
                    if (+ev.target.minZoomed < +ev.target.maxZoomed) {

                        log.debug("Historical Date Range Changed, currentWindowMin =", this.currentWindowMin);
                        log.debug("Historical Date Range Changed, currentWindowMax =", this.currentWindowMax);
                        this.updateCurrentChartExtent = true;
                    } else {
                        log.warn("Zoom min > Zoom max for Historical");
                    }
                    this.userHasInteracted = true;
                    this.exec.uiActivity();
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
            if (ev.target.maxZoomed - ev.target.minZoomed > MAX_CURRENT_WINDOW) {
                if (ev.target.maxZoomed !== this.currentWindowMax) {
                    this.currentDateAxis.zoomToDates(new Date(ev.target.maxZoomed - MAX_CURRENT_WINDOW),
                                                     new Date(ev.target.maxZoomed), true, true);
                } else {
                    this.currentDateAxis.zoomToDates(new Date(ev.target.minZoomed),
                                                     new Date(ev.target.minZoomed + MAX_CURRENT_WINDOW), true, true);
                }
            }
            this._zone.run(() => {
                if (ev.target.maxZoomed - ev.target.minZoomed > MAX_CURRENT_WINDOW) {
                    if (ev.target.maxZoomed !== this.max) {
                        this.min = ev.target.maxZoomed - MAX_CURRENT_WINDOW;
                        this.max = ev.target.maxZoomed;
                    } else {
                        this.min = ev.target.minZoomed;
                        this.max = ev.target.minZoomed + MAX_CURRENT_WINDOW;

                    }
                    // this._options = {...this._options, currentWindowMin: +ev.target.minZoomed, currentWindowMax: +ev.target.maxZoomed};
                    // tslint:disable-next-line:triple-equals
                    if (this.ready && ev.target.minZoomed != ev.target.maxZoomed) {
                        if (+ev.target.minZoomed < +ev.target.maxZoomed) {

                        } else {
                            this.min = +ev.target.minZoomed;
                            this.max = +ev.target.maxZoomed;

                        }
                        this.updateCurrentChartSelection = true;
                    } else {
                        log.warn("Zoom min > Zoom max for Current");
                    }
                }
                this.exec.uiActivity();
                this.userHasInteracted = true;
                log.debug(this._options);
            });
        });
        this.updateCurrentChartSelection = true;
    }

    private async getData(startDate: number, endDate: number, timePeriod: TimePeriod, pageSize: number = 1000,
                          interrupted: () => boolean = () => false): Promise<any[]> {

        // console.trace("getData: from: " + from + ", to: " + to + ", timePeriod: " + timePeriod);
        try {

            await this.pref.waitUntilReady();
            const layer: SSMapLayer = this.pref.enabledLayers.filter(i => i.id === this._layer)[0];
            log.debug(this._layer);
            log.debug(layer);
            const result = [];

            //We only need to get graph data up until yesterday. That way we can cache the data better.
            const today = new Date();
            today.setHours(0);
            today.setSeconds(0);
            today.setMilliseconds(0);
            today.setMinutes(0);
            if (endDate > today.getTime()) {
                endDate = today.getTime();
            }
            const startDateRounded = new Date(startDate);
            const endDateRounded = new Date(endDate);
            if (timePeriod === "day") {
                startDateRounded.setHours(0);
                endDateRounded.setHours(0);
            }
            startDateRounded.setMinutes(0);
            startDateRounded.setSeconds(0);
            startDateRounded.setMilliseconds(0);

            endDateRounded.setMinutes(0);
            endDateRounded.setSeconds(0);
            endDateRounded.setMilliseconds(0);
            const payload = {
                    ...layer,
                    regions:   this.regions,
                    timePeriod,
                    startDate: startDateRounded.getTime(),
                    endDate:   endDateRounded.getTime()

                }
            ;
            if (payload.regions.length === 0) {
                payload.regions = this.pref.combined.analyticsDefaultRegions;
            }


            const data = await this._api.callMapAPIWithCacheAndDatePaging(this.map + "/timeslider", payload, false, (i) => i,
                                                                          24 * 60 * 60,
                                                                          timePeriod === "day" ? 30 * 24 : 30 * 24, true, interrupted);
            return data;

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
