import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwitterPanelComponent } from './twitter-panel.component';

describe('TwitterPanelComponent', () => {
  let component: TwitterPanelComponent;
  let fixture: ComponentFixture<TwitterPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwitterPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwitterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
