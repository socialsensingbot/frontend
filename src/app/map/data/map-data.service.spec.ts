import { TestBed } from '@angular/core/testing';

import { S3MapDataService } from './s3-map-data.service';

describe('MapDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: S3MapDataService = TestBed.get(S3MapDataService);
    expect(service).toBeTruthy();
  });
});
