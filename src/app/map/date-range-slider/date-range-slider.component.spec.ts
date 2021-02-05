import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DateRangeSliderComponent } from './date-range-slider.component';

describe('DateRangeSliderComponent', () => {
  let component: DateRangeSliderComponent;
  let fixture: ComponentFixture<DateRangeSliderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DateRangeSliderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateRangeSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
