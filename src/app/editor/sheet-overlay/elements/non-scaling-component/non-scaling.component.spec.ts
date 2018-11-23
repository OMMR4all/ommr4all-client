import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NonScalingComponent } from './non-scaling.component';

describe('NonScalingComponent', () => {
  let component: NonScalingComponent;
  let fixture: ComponentFixture<NonScalingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NonScalingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NonScalingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
