import { TestBed, inject } from '@angular/core/testing';

import { BookViewService } from './book-view.service';

describe('BookViewService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookViewService]
    });
  });

  it('should be created', inject([BookViewService], (service: BookViewService) => {
    expect(service).toBeTruthy();
  }));
});
