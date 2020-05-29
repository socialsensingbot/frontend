import { TestBed } from '@angular/core/testing';

import { ColorCodeService } from './color-code.service';

describe('ColorCodeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ColorCodeService = TestBed.get(ColorCodeService);
    expect(service).toBeTruthy();
  });
});
