import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveGraphDialogComponent } from './save-graph-dialog.component';

describe('SaveGraphDialogComponent', () => {
  let component: SaveGraphDialogComponent;
  let fixture: ComponentFixture<SaveGraphDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SaveGraphDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveGraphDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
