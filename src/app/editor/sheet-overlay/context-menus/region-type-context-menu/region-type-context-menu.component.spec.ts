import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RegionTypeContextMenuComponent } from './region-type-context-menu.component';

describe('RegionTypeContextMenuComponent', () => {
  let component: RegionTypeContextMenuComponent;
  let fixture: ComponentFixture<RegionTypeContextMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RegionTypeContextMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegionTypeContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
