import { TestBed } from '@angular/core/testing';

import { BookDocumentsService } from './book-documents.service';

describe('BookDocumentsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BookDocumentsService = TestBed.get(BookDocumentsService);
    expect(service).toBeTruthy();
  });
});
