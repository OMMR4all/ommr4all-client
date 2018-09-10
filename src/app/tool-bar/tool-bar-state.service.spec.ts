import { TestBed, inject } from '@angular/core/testing';

import { ToolBarStateService } from './tool-bar-state.service';

describe('ToolBarStateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToolBarStateService]
    });
  });

  it('should be created', inject([ToolBarStateService], (service: ToolBarStateService) => {
    expect(service).toBeTruthy();
  }));
});
