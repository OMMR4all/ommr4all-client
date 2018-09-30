import { TestBed, inject } from '@angular/core/testing';

import { PolylineEditorService } from './polyline-editor.service';

describe('PolylineEditorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PolylineEditorService]
    });
  });

  it('should be created', inject([PolylineEditorService], (service: PolylineEditorService) => {
    expect(service).toBeTruthy();
  }));
});
