import { TestBed, inject } from '@angular/core/testing';

import { RectEditorService } from './rect-editor.service';

describe('RectEditorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RectEditorService]
    });
  });

  it('should be created', inject([RectEditorService], (service: RectEditorService) => {
    expect(service).toBeTruthy();
  }));
});
