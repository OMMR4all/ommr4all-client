import { TestBed, inject } from '@angular/core/testing';

import { DebugService } from './debug.service';

describe('DebugService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DebugService]
    });
  });

  it('should be created', inject([DebugService], (service: DebugService) => {
    expect(service).toBeTruthy();
  }));
});
