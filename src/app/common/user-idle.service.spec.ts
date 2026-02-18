import { TestBed } from '@angular/core/testing';

import { UserIdleService } from './user-idle.service';

describe('UserIdleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UserIdleService = TestBed.inject(UserIdleService);
    expect(service).toBeTruthy();
  });
});
