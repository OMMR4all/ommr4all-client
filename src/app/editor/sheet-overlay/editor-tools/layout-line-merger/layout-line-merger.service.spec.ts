import { TestBed } from '@angular/core/testing';

import { LayoutLineMergerService } from './layout-line-merger.service';

describe('LayoutLineMergerService', () => {
  let service: LayoutLineMergerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutLineMergerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
