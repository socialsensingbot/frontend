import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TweetCopyDialogComponent } from './tweet-copy-dialog.component';

describe('TweetCopyDialogComponent', () => {
  let component: TweetCopyDialogComponent;
  let fixture: ComponentFixture<TweetCopyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TweetCopyDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TweetCopyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
