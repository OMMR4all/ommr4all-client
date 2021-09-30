import { TestBed } from '@angular/core/testing';

import { WordDictionaryService } from './word-dictionary.service';

describe('WordDictionaryService', () => {
  let service: WordDictionaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WordDictionaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
