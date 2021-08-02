import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StaffLinePropertyWidgetComponent } from './staff-line-property-widget.component';

describe('StaffLinePropertyWidgetComponent', () => {
  let component: StaffLinePropertyWidgetComponent;
  let fixture: ComponentFixture<StaffLinePropertyWidgetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StaffLinePropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffLinePropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
