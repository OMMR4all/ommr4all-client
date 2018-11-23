import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NonScalingPointComponent } from './non-scaling-point.component';

describe('NonScalingPointComponent', () => {
  let component: NonScalingPointComponent;
  let fixture: ComponentFixture<NonScalingPointComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NonScalingPointComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NonScalingPointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
