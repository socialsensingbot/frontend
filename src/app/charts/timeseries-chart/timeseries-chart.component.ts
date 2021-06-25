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
import {ColumnSeries, LineSeries, XYChart} from "@amcharts/amcharts4/charts";
import jt_theme from "../../theme/jt.theme";

@Component({
               selector:    "app-timeseries-chart",
               templateUrl: "./timeseries-chart.component.html",
               styleUrls:   ["./timeseries-chart.component.scss"]
           })
export class TimeSeriesChartComponent implements OnInit, AfterViewInit {
    @Input()
    avgLength = 14;
    @Input()
    rollingAvg = false;
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
    yField = "count";
    @Input()
    xField = "date";
    @Input()
    yLabel: string;
    private trend: LineSeries;

    constructor(private _zone: NgZone, private _router: Router, private _route: ActivatedRoute) {


    }

    private _type = "line";

    public get type(): string {
        return this._type;
    }

    @Input()
    public set type(value: string) {
        this._type = value;
        this.initSeries();
    }

    private _data: any;

    public get data(): any[] {
        return this._data;
    }

    @Input()
    public set data(value: any[]) {
        this._data = value;
        if (this.chart) {
            if (this._data && this._data.length !== 0) {

                let count = 0;
                for (const item of this._data) {
                    if (this.rollingAvg || count % this.avgLength === 0) {
                        if (count >= this.avgLength) {
                            const slice = this._data.slice(count - this.avgLength, count - 1);
                            item.trend = slice.map(i => i[this.yField]).reduce((p, c) => p + c, 0) / this.avgLength;
                        }
                    }
                    count++;
                }
                this.chart.data = this._data;
                this.trend.data = this._data;

            } else {
                this.chart.data = [];
                this.trend.data = [];
            }
        }
    }

    ngAfterViewInit(): void {

        this._zone.runOutsideAngular(() => {
            /* Chart code */
            // Themes begin
            am4core.useTheme(jt_theme);
            am4core.useTheme(am4themes_animated);
            // Themes end

            this.chart = am4core.create(this.chartRef.nativeElement, am4charts.XYChart);
            this.chart.paddingRight = 20;


            this.chart.data = [];

            // Create axes
            const dateAxis = this.chart.xAxes.push(new am4charts.DateAxis());
            dateAxis.renderer.minGridDistance = 50;
            dateAxis.title.text = "Date";
            // dateAxis.title.fontWeight = "bold";
            dateAxis.title.opacity = 0.5;

            const valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
            valueAxis.title.text = this.yLabel;
            // valueAxis.title.fontWeight = "bold";
            valueAxis.title.opacity = 0.5;
            const series = this.initSeries();

            this.trend = this.chart.series.push(new am4charts.LineSeries());
            this.trend.dataFields.valueY = "trend";
            this.trend.dataFields.dateX = this.xField;
            this.trend.strokeWidth = 1;
            this.trend.stroke = this.trend.fill = am4core.color("#E5210C", 0.4);
            this.trend.data = this.chart.data;
            const avgText = this.rollingAvg ? "Rolling Avg" : "Trend";
            this.trend.tooltipText = `{dateX}\n[bold font-size: 17px]${this.avgLength}-day ${avgText}: {trend}[/]`;
            this.trend.tensionX = 0.75;
            // Add cursor
            this.chart.cursor = new am4charts.XYCursor();
            this.chart.cursor.xAxis = dateAxis;
            this.chart.cursor.snapToSeries = series;


        });
        this.ready.emit(true);
    }

    ngOnInit(): void {

    }

    private initSeries() {
        if (this.chart) {
            this.chart.series.clear();

            // Create series
            let series: LineSeries | ColumnSeries;
            if (this._type === "line") {
                series = this.chart.series.push(new am4charts.LineSeries());
                series.dataFields.valueY = this.yField;
                series.dataFields.dateX = this.xField;
                series.strokeWidth = 2;
                series.minBulletDistance = 10;
                series.stroke = series.fill = am4core.color("#9000FF", 0.5);
                series.connect = false;
                series.tooltipText = "{valueY}";
                series.tooltip.pointerOrientation = "vertical";
                series.tooltip.background.cornerRadius = 20;
                series.tooltip.background.fillOpacity = 0.5;
                series.tooltip.label.padding(12, 12, 12, 12);
                series.tensionX = 0.9;
            } else {
                series = this.chart.series.push(new am4charts.ColumnSeries());
                series.dataFields.valueY = this.yField;
                series.dataFields.dateX = this.xField;
                series.strokeWidth = 2;
                series.minBulletDistance = 10;
                series.stroke = series.fill = am4core.color("#9000FF", 0.5);
                series.tooltipText = "{valueY}";
                series.tooltip.pointerOrientation = "vertical";
                series.tooltip.background.cornerRadius = 20;
                series.tooltip.background.fillOpacity = 0.5;
                series.tooltip.label.padding(12, 12, 12, 12);

            }
            // Add scrollbar
            this.chart.scrollbarX = new am4charts.XYChartScrollbar();

            // @ts-ignore
            this.chart.scrollbarX.series.clear();
            // @ts-ignore
            this.chart.scrollbarX.series.push(series);
            return series;
        }
    }

}
