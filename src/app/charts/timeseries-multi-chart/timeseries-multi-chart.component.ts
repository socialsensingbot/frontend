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
import jt_theme from "../../theme/jt.theme";
import {Logger} from "@aws-amplify/core";
const log = new Logger("timeseries-multi-chart");

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
    xField = "date";
    @Input()
    public mappingColumns = [];
    @Input()
    public animated = false;
    @Input()
    public scrollBar = true;
    @Input() connect = false;
    @Input() zeroFillMissingDates = true;
    @Input() seriesList: string[] = [];
    private scrollBarSeries: LineSeries;
    private _ready: boolean;
    private seriesMap: { [key: string]: LineSeries | ColumnSeries } = {};
    private dateSpacing = 24 * 60 * 60 * 1000;
    private valueAxis: ValueAxis;
    private _minDate: Date;
    private _maxDate: Date;

    constructor(private _zone: NgZone, private _router: Router, private _route: ActivatedRoute) {


    }

    private _yField = "count";

    public get yField(): string {
        return this._yField;
    }

    @Input()
    public set yField(value: string) {
        this._yField = value;
        //refresh
        this.data = this._data;
    }

    private _yLabel: string;

    public get yLabel(): string {
        return this._yLabel;
    }

    @Input()
    public set yLabel(value: string) {
        this._yLabel = value;
        if (this.valueAxis) {
            this.valueAxis.title.text = this.yLabel;
        }
    }

    private _type = "line";

    public get type(): string {
        return this._type;
    }

    @Input()
    public set type(value: string) {
        this._type = value;
        if (this.chart) {
            this.createSeries();
        }
    }

    private _data: any;

    public get data(): any[] {
        return this._data;
    }

    @Input()
    public set data(value: any[]) {
        this._data = value;

        if (this._ready) {

            if (this._data && this._data.length !== 0) {
                this._minDate = null;
                this._maxDate = null;
                for (const item of this._data) {
                    const date = new Date(item[this.xField]);
                    log.debug(date);
                    if (this._minDate === null || date.getTime() < this._minDate.getTime()) {
                        this._minDate = date;
                    }
                    if (this._maxDate === null || date.getTime() > this._maxDate.getTime()) {
                        this._maxDate = date;
                    }
                }
                log.debug("MIN_DATE", this._minDate);
                log.debug("MAX_DATE", this._maxDate);
                let count = 0;
                for (const item of this._data) {
                    if (this.rollingAvg || count % this.avgLength === 0) {
                        if (count >= this.avgLength) {
                            const slice = this._data.slice(count - this.avgLength, count - 1);
                            item.trend = slice.map(i => i[this._yField]).reduce((p, c) => p + c, 0) / this.avgLength;
                        }
                    }
                    count++;
                }
                this.initChart();
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
            this.initChart();

        });
        this.ready.emit(true);
        this._ready = true;
    }

    ngOnInit(): void {

    }

    public zeroFill(mappedData: any[]) {
        if (this.zeroFillMissingDates) {
            const result = [];
            let lastRowDate = null;
            for (const row of mappedData) {
                const rowDate = Math.round(new Date(row[this.xField]).getTime() / this.dateSpacing) * this.dateSpacing;
                if (lastRowDate !== null) {
                    if (rowDate > lastRowDate + this.dateSpacing) {
                        for (let fillDate = lastRowDate + this.dateSpacing; fillDate < rowDate; fillDate += this.dateSpacing) {
                            const fillRow = {};
                            fillRow[this.xField] = new Date(fillDate);
                            fillRow[this._yField] = 0;
                            result.push(fillRow);
                        }
                    }
                }
                result.push(row);
                lastRowDate = rowDate;
            }
            log.debug("Before ZERO FILL ", mappedData);
            log.debug("After ZERO FILL ", result);
            return result;
        } else {
            return mappedData;
        }

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
        this.valueAxis.title.text = this._yLabel;
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

    private createSeriesFromMappedData(mappedKey, mappedData: any[]) {
        if (typeof this.seriesMap[mappedKey] !== "undefined") {
            this.seriesMap[mappedKey].data = this.zeroFill(mappedData);
            this.seriesMap[mappedKey].validateData();
            return this.seriesMap[mappedKey];
        }
        // Create series
        let series: LineSeries | ColumnSeries;
        if (this._type === "line") {
            series = this.chart.series.push(new am4charts.LineSeries());
            series.data = this.zeroFill(mappedData);
            series.dataFields.valueY = this._yField;
            series.dataFields.dateX = this.xField;
            series.strokeWidth = 3;
            series.minBulletDistance = 10;
            // series.stroke = series.fill = am4core.color("#9000FF", 0.5);

            series.tooltipText = {mappedKey} + " {valueY}";
            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12, 12, 12, 12);
            series.tensionX = this.connect ? 0.9 : 0.8;
            series.connect = this.connect;
        } else {
            series = this.chart.series.push(new am4charts.ColumnSeries());
            series.data = mappedData;
            series.dataFields.valueY = this._yField;
            series.dataFields.dateX = this.xField;
            series.tooltipText = {mappedKey} + " {valueY}";
            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12, 12, 12, 12);
            // series.stacked = true;
            // series.sequencedInterpolation = true;
        }
        this.valueAxis.zoom({start: 0, end: 1}, false, true);

        series.name = mappedKey;
        log.info("Added series " + series.name);
        this.seriesMap[mappedKey] = series;
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

            log.debug("Data for TMC", this.data);
            const mappedData = {};
            const totals = {};
            for (const row of this.data) {
                for (const mappingColumn of this.mappingColumns) {
                    const mappedKey = row[mappingColumn];
                    if (typeof mappedKey !== "undefined" && mappedKey !== null && mappedKey.length > 0) {
                        const totalValue = totals[row[this.xField]];
                        if (typeof totalValue === "undefined") {
                            totals[row[this.xField]] = +(row[this._yField]);
                        } else {
                            totals[row[this.xField]] += row[this._yField];
                        }
                        if (mappedData[mappedKey]) {
                            mappedData[mappedKey].push(row);
                        } else {
                            mappedData[mappedKey] = [row];
                        }
                    }
                }
            }
            log.debug("Totals", totals);
            const totalRows = [];
            for (const key in totals) {
                if (totals.hasOwnProperty(key)) {
                    const row: any = {};
                    row[this.xField] = key;
                    row.total = totals[key];
                    totalRows.push(row);
                }
            }
            log.debug("Sum series", totalRows);
            // this.createScrollBarSeries(totalRows);

            let lastSeries;
            for (const requiredSeries of this.seriesList) {
                if (mappedData.hasOwnProperty(requiredSeries)) {
                    const data = mappedData[requiredSeries].sort(
                        (a, b) => new Date(a[this.xField]).getTime() - new Date(b[this.xField]).getTime());
                    log.debug("Sorted series (by " + this.xField + ")", data);
                    lastSeries = this.createSeriesFromMappedData(requiredSeries, data);
                } else {
                    if (this.zeroFillMissingDates) {
                        const dummyMin = {};
                        dummyMin[this.xField] = this._minDate;
                        dummyMin[this._yField] = 0;
                        const dummyMax = {};
                        dummyMax[this.xField] = this._maxDate;
                        dummyMax[this._yField] = 0;
                        mappedData[requiredSeries] = [dummyMin, dummyMax]
                        this.createSeriesFromMappedData(requiredSeries, mappedData[requiredSeries]);
                    }
                }
            }

            // Clean up old series
            for (const key in this.seriesMap) {
                if (this.seriesMap.hasOwnProperty(key)) {
                    if (typeof mappedData[key] === "undefined") {
                        this.chart.series.removeValue(this.seriesMap[key]);
                        if (this.scrollBar) {

                            // @ts-ignore
                            this.chart.scrollbarX.series.removeValue(this.seriesMap[key]);
                        }
                        delete this.seriesMap[key];
                    }
                }
            }


            // this.chart.cursor.snapToSeries = lastSeries;

        }
    }
}
