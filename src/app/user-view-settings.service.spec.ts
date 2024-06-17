import { TestBed } from '@angular/core/testing';

import { UserViewSettingsService } from './user-view-settings.service';

describe('UserViewSettingsService', () => {
  let service: UserViewSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserViewSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
