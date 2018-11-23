import { TestBed, inject } from '@angular/core/testing';

import { RegionTypeContextMenuService } from './region-type-context-menu.service';

describe('RegionTypeContextMenuService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RegionTypeContextMenuService]
    });
  });

  it('should be created', inject([RegionTypeContextMenuService], (service: RegionTypeContextMenuService) => {
    expect(service).toBeTruthy();
  }));
});
