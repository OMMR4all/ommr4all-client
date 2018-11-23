import { TestBed, inject } from '@angular/core/testing';

import { PagesPreviewService } from './pages-preview.service';

describe('PagesPreviewService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PagesPreviewService]
    });
  });

  it('should be created', inject([PagesPreviewService], (service: PagesPreviewService) => {
    expect(service).toBeTruthy();
  }));
});
