import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeseriesWidgetComponent } from './timeseries-widget.component';

describe('TwitterTimeseriesComponent', () => {
  let component: TimeseriesWidgetComponent;
  let fixture: ComponentFixture<TimeseriesWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TimeseriesWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeseriesWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
