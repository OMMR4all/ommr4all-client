import { TestBed, inject } from '@angular/core/testing';

import { SymbolEditorService } from './symbol-editor.service';

describe('SymbolEditorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SymbolEditorService]
    });
  });

  it('should be created', inject([SymbolEditorService], (service: SymbolEditorService) => {
    expect(service).toBeTruthy();
  }));
});
