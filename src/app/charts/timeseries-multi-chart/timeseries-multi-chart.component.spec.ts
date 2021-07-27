import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TimeSeriesMultiChartComponent } from "./timeseries-multi-chart.component";

describe("DataGroupedLineComponent", () => {
  let component: TimeSeriesMultiChartComponent;
  let fixture: ComponentFixture<TimeSeriesMultiChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TimeSeriesMultiChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSeriesMultiChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
