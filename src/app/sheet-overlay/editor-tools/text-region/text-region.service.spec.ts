import { TestBed, inject } from '@angular/core/testing';

import { TextRegionService } from './text-region.service';

describe('TextRegionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TextRegionService]
    });
  });

  it('should be created', inject([TextRegionService], (service: TextRegionService) => {
    expect(service).toBeTruthy();
  }));
});
