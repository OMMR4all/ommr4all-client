import { TestBed, inject } from '@angular/core/testing';

import { StateMachinaService } from './state-machina.service';

describe('StateMachinaService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StateMachinaService]
    });
  });

  it('should be created', inject([StateMachinaService], (service: StateMachinaService) => {
    expect(service).toBeTruthy();
  }));
});
