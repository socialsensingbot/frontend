import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {CountryCodeSelectComponent} from './country-code-select.component';

describe('CountryCodeSelectComponent', () => {
  let component: CountryCodeSelectComponent;
  let fixture: ComponentFixture<CountryCodeSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
                                     declarations: [CountryCodeSelectComponent]
                                   })
           .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CountryCodeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
