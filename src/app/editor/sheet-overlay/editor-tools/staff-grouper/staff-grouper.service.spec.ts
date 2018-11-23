import { TestBed, inject } from '@angular/core/testing';

import { StaffGrouperService } from './staff-grouper.service';

describe('StaffGrouperService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StaffGrouperService]
    });
  });

  it('should be created', inject([StaffGrouperService], (service: StaffGrouperService) => {
    expect(service).toBeTruthy();
  }));
});
