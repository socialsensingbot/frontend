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
               selector:    "app-timeseries-multi-chart",
               templateUrl: "./timeseries-multi-chart.component.html",
               styleUrls:   ["./timeseries-multi-chart.component.scss"]
           })
export class TimeSeriesMultiChartComponent implements OnInit, AfterViewInit {
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
    @Input()
    public mappingColumns = [];
    @Input()
    public animated = false;
    private scrollBarSeries: LineSeries;

    constructor(private _zone: NgZone, private _router: Router, private _route: ActivatedRoute) {


    }

    private _type = "line";

    public get type(): string {
        return this._type;
    }

    @Input()
    public set type(value: string) {
        this._type = value;
        this.createSeries();
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
                this.createSeries();

                // this.trend.data = this._data;

            } else {

                // this.trend.data = [];
            }
        }
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

            this.chart = am4core.create(this.chartRef.nativeElement, am4charts.XYChart);
            this.chart.paddingRight = 20;


            this.chart.data = [];
            this.chart.legend = new am4charts.Legend();
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
            this.chart.scrollbarX = new am4charts.XYChartScrollbar();

            this.createSeries();


        });
        this.ready.emit(true);
    }

    ngOnInit(): void {

    }


    private createSeriesFromMappedData(mappedKey, mappedData: any[]) {
        // Create series
        let series: LineSeries | ColumnSeries;
        if (this._type === "line") {
            series = this.chart.series.push(new am4charts.LineSeries());
            series.data = mappedData;
            series.dataFields.valueY = this.yField;
            series.dataFields.dateX = this.xField;
            series.strokeWidth = 2;
            series.minBulletDistance = 10;
            // series.stroke = series.fill = am4core.color("#9000FF", 0.5);

            series.tooltipText = {mappedKey} + " {valueY}";
            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12, 12, 12, 12);
            series.tensionX = 0.95;
            series.connect = false;
        } else {
            series = this.chart.series.push(new am4charts.ColumnSeries());
            series.data = mappedData;
            series.dataFields.valueY = this.yField;
            series.dataFields.dateX = this.xField;
            series.tooltipText = {mappedKey} + " {valueY}";
            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12, 12, 12, 12);
            series.stacked = true;
            series.sequencedInterpolation = true;
        }

        series.name = mappedKey;
        return series;

    }


    private createScrollBarSeries(data: any[]) {
        if (this.chart) {
            this.scrollBarSeries = this.chart.series.push(new am4charts.LineSeries());
            this.scrollBarSeries.hide();
            this.scrollBarSeries.data = data;
            this.scrollBarSeries.dataFields.valueY = "total";
            // This hides the series from the main chart
            this.scrollBarSeries.hiddenInLegend = true;
            this.scrollBarSeries.dataFields.dateX = this.xField;
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

    private createSeries() {
        if (this.chart) {
            this.chart.series.clear();
        }
        const seriesMap = {};
        const totals = {};
        for (const row of this.data) {
            for (const mappingColumn of this.mappingColumns) {
                const mappedKey = row[mappingColumn];
                if (typeof mappedKey !== "undefined" && mappedKey !== null && mappedKey.length > 0) {
                    const totalValue = totals[row[this.xField]];
                    if (typeof totalValue === "undefined") {
                        totals[row[this.xField]] = +(row[this.yField]);
                    } else {
                        totals[row[this.xField]] += row[this.yField];
                    }
                    if (seriesMap[mappedKey]) {
                        seriesMap[mappedKey].push(row);
                    } else {
                        seriesMap[mappedKey] = [row];
                    }
                }
            }
        }
        console.log("Totals", totals);
        const totalRows = [];
        for (const key in totals) {
            if (totals.hasOwnProperty(key)) {
                const row: any = {};
                row[this.xField] = key;
                row.total = totals[key];
                totalRows.push(row);
            }
        }
        console.log("Sum series", totalRows);
        // this.createScrollBarSeries(totalRows);

        let lastSeries;
        for (const key in seriesMap) {
            if (seriesMap.hasOwnProperty(key)) {
                const data = seriesMap[key].sort(
                    (a, b) => new Date(a[this.xField]).getTime() - new Date(b[this.xField]).getTime());
                console.log("Sorted series (by " + this.xField + ")", data);
                lastSeries = this.createSeriesFromMappedData(key, data);
            }
        }

        // @ts-ignore
        this.chart.scrollbarX.series.clear();
        // @ts-ignore
        this.chart.scrollbarX.series.push(lastSeries);

        this.chart.cursor.snapToSeries = lastSeries;

    }
}
