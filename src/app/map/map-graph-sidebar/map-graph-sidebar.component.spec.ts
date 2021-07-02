import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapGraphSidebarComponent } from './map-graph-sidebar.component';

describe('MapGraphSidebarComponent', () => {
  let component: MapGraphSidebarComponent;
  let fixture: ComponentFixture<MapGraphSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MapGraphSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapGraphSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
