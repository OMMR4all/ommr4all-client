import { TestBed, inject } from '@angular/core/testing';

import { LineEditorService } from './line-editor.service';

describe('LineEditorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LineEditorService]
    });
  });

  it('should be created', inject([LineEditorService], (service: LineEditorService) => {
    expect(service).toBeTruthy();
  }));
});
