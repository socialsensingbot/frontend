import { TestBed } from '@angular/core/testing';

import { LayerStyleService } from './layer-style.service';

describe('LayerStyleServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LayerStyleService = TestBed.get(LayerStyleService);
    expect(service).toBeTruthy();
  });
});
