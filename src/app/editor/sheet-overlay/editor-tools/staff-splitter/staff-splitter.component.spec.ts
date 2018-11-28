import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffSplitterComponent } from './staff-splitter.component';

describe('StaffSplitterComponent', () => {
  let component: StaffSplitterComponent;
  let fixture: ComponentFixture<StaffSplitterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StaffSplitterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffSplitterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
