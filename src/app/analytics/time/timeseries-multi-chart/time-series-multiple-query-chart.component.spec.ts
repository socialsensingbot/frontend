import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TimeSeriesMultipleQueryChartComponent } from "./time-series-multiple-query-chart.component";

describe("DataGroupedLineComponent", () => {
  let component: TimeSeriesMultipleQueryChartComponent;
  let fixture: ComponentFixture<TimeSeriesMultipleQueryChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TimeSeriesMultipleQueryChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSeriesMultipleQueryChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
