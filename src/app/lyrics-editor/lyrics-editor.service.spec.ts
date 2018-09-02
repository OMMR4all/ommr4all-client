import { TestBed, inject } from '@angular/core/testing';

import { LyricsEditorService } from './lyrics-editor.service';

describe('LyricsEditorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LyricsEditorService]
    });
  });

  it('should be created', inject([LyricsEditorService], (service: LyricsEditorService) => {
    expect(service).toBeTruthy();
  }));
});
