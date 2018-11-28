import { TestBed, inject } from '@angular/core/testing';

import { StaffSplitterService } from './staff-splitter.service';

describe('StaffSplitterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StaffSplitterService]
    });
  });

  it('should be created', inject([StaffSplitterService], (service: StaffSplitterService) => {
    expect(service).toBeTruthy();
  }));
});
