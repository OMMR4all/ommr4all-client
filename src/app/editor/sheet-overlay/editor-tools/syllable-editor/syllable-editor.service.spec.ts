import { TestBed, inject } from '@angular/core/testing';

import { SyllableEditorService } from './syllable-editor.service';

describe('SyllableEditorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SyllableEditorService]
    });
  });

  it('should be created', inject([SyllableEditorService], (service: SyllableEditorService) => {
    expect(service).toBeTruthy();
  }));
});
