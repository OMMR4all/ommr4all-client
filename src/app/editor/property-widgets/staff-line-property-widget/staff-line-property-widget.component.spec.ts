import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffLinePropertyWidgetComponent } from './staff-line-property-widget.component';

describe('StaffLinePropertyWidgetComponent', () => {
  let component: StaffLinePropertyWidgetComponent;
  let fixture: ComponentFixture<StaffLinePropertyWidgetComponent>;

  beforeEach(async(() => {
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
