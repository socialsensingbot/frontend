import { TestBed } from '@angular/core/testing';

import { TweetProcessService } from './tweet-process.service';

describe('TweetProcessServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TweetProcessService = TestBed.get(TweetProcessService);
    expect(service).toBeTruthy();
  });
});
