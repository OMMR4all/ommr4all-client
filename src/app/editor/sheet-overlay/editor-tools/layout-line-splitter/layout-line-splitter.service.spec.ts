import { TestBed } from '@angular/core/testing';

import { LayoutLineSplitterService } from './layout-line-splitter.service';

describe('LayoutLineSplitterService', () => {
  let service: LayoutLineSplitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutLineSplitterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
