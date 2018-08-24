import { TestBed, inject } from '@angular/core/testing';

import { StaffsService } from './staffs.service';

describe('StaffsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StaffsService]
    });
  });

  it('should be created', inject([StaffsService], (service: StaffsService) => {
    expect(service).toBeTruthy();
  }));
});
