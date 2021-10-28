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
} from '@angular/core';
import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4charts from "@amcharts/amcharts4/charts";
import {XYChart} from "@amcharts/amcharts4/charts";
import {ActivatedRoute, Router} from "@angular/router";
import jt_theme from "../../theme/jt.theme";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnInit, AfterViewInit {

  @ViewChild("chart") chartRef: ElementRef;

  @Input()
  public updating: boolean;

  @Input()
  public noData: boolean;

  @Input()
  public error: boolean;


  @Input()
  public set data(value: any) {
    this._data = value;
    if(this.chart) {
        this.chart.data= value;
    }
  }

  public get data(): any {
    return this._data;
  }

  @Output() ready = new EventEmitter<boolean>();
  chart: XYChart;
  private _data: any;

  constructor(private _zone: NgZone, private _router:Router,private _route: ActivatedRoute) {


  }


  @Input()
   yField = "count";

  @Input()
   xField = "date";

  @Input()
  yLabel: string;

  @Input()
  xLabel: string;

  @Input()
  public height: number= 500;

  ngAfterViewInit(): void {
    this._zone.runOutsideAngular(() => {
      /* Chart code */
      // Themes begin
      am4core.useTheme(jt_theme);
      am4core.useTheme(am4themes_animated);
      // Themes end

      // Create chart instance
      this.chart = am4core.create(this.chartRef.nativeElement, am4charts.XYChart);

      // Add data
      this.chart.data = [];
      this.chart.scrollbarX = new am4core.Scrollbar();
      this.chart.scrollbarY = new am4core.Scrollbar();

      // Create axes

      let categoryAxis = this.chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = this.xField;
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.minGridDistance = 30;
      categoryAxis.title.text = this.xLabel;
      // categoryAxis.title.fontWeight = "lighter";
      categoryAxis.title.opacity = 0.5;
      categoryAxis.title.marginTop=8;
      const label = categoryAxis.renderer.labels.template;
      label.rotation = -90;
      label.horizontalCenter = "left";
      label.location = 0.5;
      label.wrap = true;
      label.maxWidth = 120;
      //
      // categoryAxis.renderer.labels.template.adapter.add("dy", function(dy, target) {
      //   if (target.dataItem && target.dataItem.index & 2 == 2) {
      //     return dy + 25;
      //   }
      //   return dy;
      // });

      let valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = this.yLabel;
      // valueAxis.title.fontWeight = "bold";
      valueAxis.title.opacity = 0.5;

      // Create series
      let series = this.chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = this.yField;
      series.dataFields.categoryX = this.xField;
      series.name = "Adverts";
      series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
      series.columns.template.fillOpacity = .8;
      let columnTemplate = series.columns.template;
      columnTemplate.strokeWidth = 2;
      columnTemplate.strokeOpacity = 1;
    });
    this.ready.emit(true);
  }
  ngOnInit(): void {



  }

}
