import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StaffSplitterComponent } from './staff-splitter.component';

describe('StaffSplitterComponent', () => {
  let component: StaffSplitterComponent;
  let fixture: ComponentFixture<StaffSplitterComponent>;

  beforeEach(waitForAsync(() => {
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
