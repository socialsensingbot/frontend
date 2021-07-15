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
import * as am4charts from "@amcharts/amcharts4/charts";
import {PieChart} from "@amcharts/amcharts4/charts";
import {ActivatedRoute, Router} from "@angular/router";
import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import jt_theme from "../../theme/jt.theme";
import {Logger} from "@aws-amplify/core";
const log = new Logger("pie-chart");

@Component({
             selector:    "app-pie-chart",
             templateUrl: "./pie-chart.component.html",
             styleUrls:   ["./pie-chart.component.scss"]
           })
export class PieChartComponent implements OnInit, AfterViewInit {


  @ViewChild("chart") chartRef: ElementRef;

  @Input()
  public updating: boolean;

  @Input()
  public noData: boolean;

  @Input()
  public error: boolean;

  @Output()
  public ready = new EventEmitter<boolean>();
  @Input()
  public valueField;
  @Input()
  public categoryField;
  private _chart: PieChart;

  constructor(private _zone: NgZone, private _router: Router, private _route: ActivatedRoute) {


  }

  private _data: any;

  public get data(): any {
    return this._data;
  }

  @Input()
  public set data(value: any) {
    this._data = value;
    if (this._chart) {
      log.debug("Pie chart data ", value);
      this._chart.data = value;

    }
  }

  ngAfterViewInit(): void {
    this._zone.runOutsideAngular(() => {
      /* Chart code */
      // Themes begin
      am4core.useTheme(jt_theme);
      am4core.useTheme(am4themes_animated);
      // Themes end

      // Create chart instance
      this._chart = am4core.create(this.chartRef.nativeElement, am4charts.PieChart);
      this._chart.data = [];
      // Add and configure Series
      const pieSeries = this._chart.series.push(new am4charts.PieSeries());
      pieSeries.dataFields.value = this.valueField;
      pieSeries.dataFields.category = this.categoryField;
      pieSeries.slices.template.stroke = am4core.color("#FFFFFF");
      pieSeries.slices.template.strokeOpacity = 1;

      // This creates initial animation
      pieSeries.hiddenState.properties.opacity = 1;
      pieSeries.hiddenState.properties.endAngle = -90;
      pieSeries.hiddenState.properties.startAngle = -90;

      this._chart.hiddenState.properties.radius = am4core.percent(0);
      log.debug("Pie chart ready");
    });
    this.ready.emit(true);
  }

  ngOnInit(): void {


  }

}
