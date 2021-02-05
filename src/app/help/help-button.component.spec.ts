import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {HelpButtonComponent} from './help-button.component';

describe('HelpComponent', () => {
  let component: HelpButtonComponent;
  let fixture: ComponentFixture<HelpButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
                                     declarations: [HelpButtonComponent]
                                   })
           .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
