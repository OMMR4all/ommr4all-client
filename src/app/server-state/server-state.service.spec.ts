import { TestBed, inject } from '@angular/core/testing';

import { ServerStateService } from './server-state.service';

describe('ServerStateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServerStateService]
    });
  });

  it('should be created', inject([ServerStateService], (service: ServerStateService) => {
    expect(service).toBeTruthy();
  }));
});
