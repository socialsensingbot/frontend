import { TestBed } from '@angular/core/testing';

import { UIExecutionService } from './uiexecution.service';

describe('UIExecutionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UIExecutionService = TestBed.get(UIExecutionService);
    expect(service).toBeTruthy();
  });
});
