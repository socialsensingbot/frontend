import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeseriesAnalyticsComponent } from './timeseries-analytics.component';

describe('TwitterTimeseriesComponent', () => {
  let component: TimeseriesAnalyticsComponent;
  let fixture: ComponentFixture<TimeseriesAnalyticsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TimeseriesAnalyticsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeseriesAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
