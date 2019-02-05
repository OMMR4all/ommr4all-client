import { TestBed } from '@angular/core/testing';

import { ViewChangesService } from './view-changes.service';

describe('ViewChangesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ViewChangesService = TestBed.get(ViewChangesService);
    expect(service).toBeTruthy();
  });
});
