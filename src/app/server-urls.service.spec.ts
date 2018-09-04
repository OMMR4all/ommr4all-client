import { TestBed, inject } from '@angular/core/testing';

import { ServerUrlsService } from './server-urls.service';

describe('ServerUrlsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServerUrlsService]
    });
  });

  it('should be created', inject([ServerUrlsService], (service: ServerUrlsService) => {
    expect(service).toBeTruthy();
  }));
});
