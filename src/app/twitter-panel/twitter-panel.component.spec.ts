import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwitterPanelComponent } from './twitter-panel.component';

describe('TwitterPanelComponent', () => {
  let component: TwitterPanelComponent;
  let fixture: ComponentFixture<TwitterPanelComponent>;

  beforeEach(async(() => {
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
