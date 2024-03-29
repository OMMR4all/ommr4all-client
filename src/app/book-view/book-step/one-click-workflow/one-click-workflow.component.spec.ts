import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OneClickWorkflowComponent } from './one-click-workflow.component';

describe('OneClickWorkflowComponent', () => {
  let component: OneClickWorkflowComponent;
  let fixture: ComponentFixture<OneClickWorkflowComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OneClickWorkflowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OneClickWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
