import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowFinishDialogComponent } from './workflow-finish-dialog.component';

describe('WorkflowFinishDialogComponent', () => {
  let component: WorkflowFinishDialogComponent;
  let fixture: ComponentFixture<WorkflowFinishDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowFinishDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowFinishDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
