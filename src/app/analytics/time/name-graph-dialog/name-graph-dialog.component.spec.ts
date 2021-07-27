import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NameGraphDialogComponent } from './name-graph-dialog.component';

describe('SaveGraphDialogComponent', () => {
  let component: NameGraphDialogComponent;
  let fixture: ComponentFixture<NameGraphDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NameGraphDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NameGraphDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
