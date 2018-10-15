import { TestBed, inject } from '@angular/core/testing';

import { TextEditorService } from './text-editor.service';

describe('TextEditorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TextEditorService]
    });
  });

  it('should be created', inject([TextEditorService], (service: TextEditorService) => {
    expect(service).toBeTruthy();
  }));
});
