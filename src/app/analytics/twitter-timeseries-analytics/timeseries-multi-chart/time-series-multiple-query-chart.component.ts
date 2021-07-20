import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnInit,
    Output,
    ViewChild
} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4charts from "@amcharts/amcharts4/charts";
import {ColumnSeries, LineSeries, ValueAxis, XYChart} from "@amcharts/amcharts4/charts";
import jt_theme from "../../../theme/jt.theme";
import {Logger} from "@aws-amplify/core";
import {TimeseriesCollectionModel} from "../../timeseries";

const log = new Logger("app-timeseries-multi-query-chart");


@Component({
               selector:    "app-timeseries-multi-query-chart",
               templateUrl: "./time-series-multiple-query-chart.component.html",
               styleUrls:   ["./time-series-multiple-query-chart.component.scss"]
           })
export class TimeSeriesMultipleQueryChartComponent implements OnInit, AfterViewInit {
    @ViewChild("chart") chartRef: ElementRef;
    @Input()
    public updating: boolean;
    @Input()
    public height: number;
    @Input()
    public noData: boolean;
    @Input()
    public error: boolean;
    @Output() ready = new EventEmitter<boolean>();
    chart: XYChart;
    @Input()
    public animated = false;
    @Input()
    public scrollBar = true;
    @Input() connect = false;

    private scrollBarSeries: LineSeries;
    private _ready: boolean;
    private seriesMap: { [key: string]: LineSeries | ColumnSeries } = {};
    private valueAxis: ValueAxis;

    constructor(private _zone: NgZone, private _router: Router, private _route: ActivatedRoute) {


    }


    private _type = "line";

    public get type(): string {
        return this._type;
    }

    @Input()
    public set type(value: string) {
        this._type = value;
    }

    private _seriesCollection: TimeseriesCollectionModel;

    public get seriesCollection(): TimeseriesCollectionModel {
        return this._seriesCollection;
    }

    @Input()
    public set seriesCollection(timeseriesCollection: TimeseriesCollectionModel) {
        this._seriesCollection = timeseriesCollection;
    }


    ngAfterViewInit(): void {

        this._zone.runOutsideAngular(() => {
            /* Chart code */
            // Themes begin
            am4core.useTheme(jt_theme);
            if (this.animated) {
                am4core.useTheme(am4themes_animated);
            }
            // Themes end
            this.initChart();

        });

        this.valueAxis.title.text = this.seriesCollection.yLabel;

        this._seriesCollection.foreachSeries((label, data, id) => {
            this.createSeriesFromData(label, data, id);
        });

        this._seriesCollection.seriesAdded.subscribe(series => {
            this.createSeriesFromData(series.label, series.data, series.id);
        });

        this._seriesCollection.seriesUpdated.subscribe(series => {
            this.createSeriesFromData(series.label, series.data, series.id);
        });

        this._seriesCollection.seriesRemoved.subscribe(series => {
            this.chart.series.removeValue(this.seriesMap[series]);
            if (this.scrollBar) {
                // @ts-ignore
                this.chart.scrollbarX.series.removeValue(this.seriesMap[series]);
            }
            delete this.seriesMap[series];
        });

        this._seriesCollection.yAxisChanged.subscribe(() => {
            this.initChart();
            this.valueAxis.title.text = this._seriesCollection.yLabel;
            this._seriesCollection.foreachSeries((label, data, id) => {
                this.createSeriesFromData(label, data, id);
            });
        });

        this.ready.emit(true);
        this._ready = true;
    }


    ngOnInit(): void {

    }


    private initChart() {
        if (this.chart) {
            this.chart.dispose();
        }
        this.seriesMap = {};
        this.chart = am4core.create(this.chartRef.nativeElement, am4charts.XYChart);
        this.chart.paddingRight = 20;


        this.chart.data = [];
        this.chart.legend = new am4charts.Legend();
        this.chart.legend.maxHeight = 120;
        this.chart.legend.scrollable = true;

        // Create axes
        const dateAxis = this.chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.minGridDistance = 50;
        dateAxis.title.text = "Date";
        // dateAxis.title.fontWeight = "bold";
        dateAxis.title.opacity = 0.5;

        this.valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
        this.valueAxis.title.text = this._seriesCollection.yLabel;
        // valueAxis.title.fontWeight = "bold";
        this.valueAxis.title.opacity = 0.5;
        //
        //
        // this.trend = this.chart.series.push(new am4charts.LineSeries());
        // this.trend.dataFields.valueY = "trend";
        // this.trend.dataFields.dateX = this.xField;
        // this.trend.strokeWidth = 1;
        // this.trend.stroke = this.trend.fill = am4core.color("#E5210C", 0.4);
        // this.trend.data = this.chart.data;
        // const avgText = this.rollingAvg ? "Rolling Avg" : "Trend";
        // this.trend.tooltipText = `{dateX}\n[bold font-size: 17px]${this.avgLength}-day ${avgText}: {trend}[/]`;
        // this.trend.tensionX = 0.75;
        // Add cursor
        this.chart.cursor = new am4charts.XYCursor();
        this.chart.cursor.xAxis = dateAxis;
        if (this.scrollBar) {
            this.chart.scrollbarX = new am4charts.XYChartScrollbar();
        }
        this.chart.responsive.enabled = true;
    }

    private createSeriesFromData(label, seriesData: any[], id: string) {
        if (typeof this.seriesMap[id] !== "undefined") {
            this.seriesMap[id].data = seriesData;
            this.seriesMap[id].name = label;
            this.seriesMap[id].validateData();
            return this.seriesMap[id];
        }
        // Create series
        let series: LineSeries | ColumnSeries;
        if (this._type === "line") {
            series = this.chart.series.push(new am4charts.LineSeries());
            series.data = seriesData;
            series.dataFields.valueY = this.seriesCollection.yField;
            series.dataFields.dateX = this.seriesCollection.xField;
            series.strokeWidth = 3;
            series.minBulletDistance = 10;
            // series.stroke = series.fill = am4core.color("#9000FF", 0.5);

            series.tooltipText = {mappedKey: label} + " {valueY}";
            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12, 12, 12, 12);
            series.tensionX = this.connect ? 0.9 : 0.8;
            series.connect = this.connect;
        } else {
            series = this.chart.series.push(new am4charts.ColumnSeries());
            series.data = seriesData;
            series.dataFields.valueY = this.seriesCollection.yField;
            series.dataFields.dateX = this.seriesCollection.xField;
            series.tooltipText = {mappedKey: label} + " {valueY}";
            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12, 12, 12, 12);
            // series.stacked = true;
            // series.sequencedInterpolation = true;
        }
        this.valueAxis.zoom({start: 0, end: 1}, false, true);

        series.name = label;
        log.info("Added series " + series.name);
        this.seriesMap[id] = series;
        if (this.scrollBar) {
            // @ts-ignore
            this.chart.scrollbarX.series.push(series);
        }

        return series;

    }

    private createScrollBarSeries(data: any[]) {
        if (this.chart && this.scrollBar) {
            this.scrollBarSeries = this.chart.series.push(new am4charts.LineSeries());
            this.scrollBarSeries.hide();
            this.scrollBarSeries.data = data;
            this.scrollBarSeries.dataFields.valueY = "total";
            // This hides the series from the main chart
            this.scrollBarSeries.hiddenInLegend = true;
            this.scrollBarSeries.dataFields.dateX = this.seriesCollection.xField;
            this.scrollBarSeries.strokeWidth = 2;
            this.scrollBarSeries.minBulletDistance = 10;
            this.scrollBarSeries.name = "total";
            // series.stroke = series.fill = am4core.color("#9000FF", 0.5);

            this.scrollBarSeries.tensionX = 0.95;
            this.scrollBarSeries.connect = false;

            this.chart.scrollbarX = new am4charts.XYChartScrollbar();
            // @ts-ignore
            this.chart.scrollbarX.series.push(this.scrollBarSeries);
            // @ts-ignore
            let scrollSeries1 = this.chart.scrollbarX.scrollbarChart.series.getIndex(0);
            // This makes the series visible *but only in the scrollbar*
            scrollSeries1.hidden = false;
            this.chart.cursor.snapToSeries = this.scrollBarSeries;

            this.chart.series.removeValue(this.scrollBarSeries);
        }
    }


}
