import { TestBed } from '@angular/core/testing';

import { LayoutPropertyWidgetService } from './layout-property-widget.service';

describe('LayoutPropertyWidgetService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LayoutPropertyWidgetService = TestBed.inject(LayoutPropertyWidgetService);
    expect(service).toBeTruthy();
  });
});
