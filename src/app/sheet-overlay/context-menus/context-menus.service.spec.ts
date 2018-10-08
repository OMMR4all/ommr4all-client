import { TestBed, inject } from '@angular/core/testing';

import { ContextMenusService } from './context-menus.service';

describe('ContextMenusService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContextMenusService]
    });
  });

  it('should be created', inject([ContextMenusService], (service: ContextMenusService) => {
    expect(service).toBeTruthy();
  }));
});
