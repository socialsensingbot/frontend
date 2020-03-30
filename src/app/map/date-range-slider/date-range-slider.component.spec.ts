import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DateRangeSliderComponent } from './date-range-slider.component';

describe('DateRangeSliderComponent', () => {
  let component: DateRangeSliderComponent;
  let fixture: ComponentFixture<DateRangeSliderComponent>;

  beforeEach(async(() => {
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
