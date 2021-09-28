import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {ForgotPassComponent} from './forgot-pass.component';

describe('SignInComponent', () => {
  let component: ForgotPassComponent;
  let fixture: ComponentFixture<ForgotPassComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
                                     declarations: [ForgotPassComponent]
                                   })
           .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ForgotPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
