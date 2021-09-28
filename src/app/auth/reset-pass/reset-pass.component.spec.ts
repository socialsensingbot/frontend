import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {ResetPassComponent} from './reset-pass.component';

describe('SignInComponent', () => {
  let component: ResetPassComponent;
  let fixture: ComponentFixture<ResetPassComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
                                     declarations: [ResetPassComponent]
                                   })
           .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
