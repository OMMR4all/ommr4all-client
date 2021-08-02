import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StaffGrouperComponent } from './staff-grouper.component';

describe('StaffGrouperComponent', () => {
  let component: StaffGrouperComponent;
  let fixture: ComponentFixture<StaffGrouperComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StaffGrouperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffGrouperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
