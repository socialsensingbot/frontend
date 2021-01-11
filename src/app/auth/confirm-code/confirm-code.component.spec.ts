import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {ConfirmCodeComponent} from './confirm-code.component';

describe('ConfirmCodeComponent', () => {
  let component: ConfirmCodeComponent;
  let fixture: ComponentFixture<ConfirmCodeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
                                     declarations: [ConfirmCodeComponent]
                                   })
           .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
