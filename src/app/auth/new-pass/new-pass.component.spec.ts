import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {NewPassComponent} from './new-pass.component';

describe('SignInComponent', () => {
  let component: NewPassComponent;
  let fixture: ComponentFixture<NewPassComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
                                     declarations: [NewPassComponent]
                                   })
           .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
