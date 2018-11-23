import { TestBed, inject } from '@angular/core/testing';

import { SheetOverlayService } from './sheet-overlay.service';

describe('SheetOverlayService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SheetOverlayService]
    });
  });

  it('should be created', inject([SheetOverlayService], (service: SheetOverlayService) => {
    expect(service).toBeTruthy();
  }));
});
