import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwitterTimeseriesComponent } from './twitter-timeseries.component';

describe('TwitterTimeseriesComponent', () => {
  let component: TwitterTimeseriesComponent;
  let fixture: ComponentFixture<TwitterTimeseriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwitterTimeseriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwitterTimeseriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
