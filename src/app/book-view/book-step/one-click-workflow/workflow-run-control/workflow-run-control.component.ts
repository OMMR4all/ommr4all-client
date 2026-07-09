import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BookPermissionFlag, BookPermissionFlags} from '../../../../data-types/permissions';
import {WorkflowValidationResult} from '../workflow-config';
import {StepRunState, WorkflowRunner} from '../workflow-runner';

@Component({
    selector: 'app-workflow-run-control',
    templateUrl: './workflow-run-control.component.html',
    styleUrls: ['./workflow-run-control.component.scss'],
    standalone: false
})
export class WorkflowRunControlComponent {
  readonly SRS = StepRunState;

  @Input() runner: WorkflowRunner;
  @Input() validation: WorkflowValidationResult;
  @Input() permissions: number;

  @Output() runWorkflow = new EventEmitter<void>();
  @Output() cancelWorkflow = new EventEmitter<void>();

  get writeAllowed(): boolean { return new BookPermissionFlags(this.permissions).has(BookPermissionFlag.Write); }
  get runAllowed(): boolean { return this.writeAllowed && this.validation.valid && !this.runner.running; }

  get runDisabledReason(): string {
    if (!this.writeAllowed) { return 'You have no permission to run the workflow.'; }
    const firstError = this.validation.issues.find(i => i.severity === 'error');
    return firstError ? firstError.message : '';
  }

  iconFor(state: StepRunState): string {
    switch (state) {
      case StepRunState.Done: return 'check_circle';
      case StepRunState.Failed: return 'error';
      case StepRunState.Cancelled: return 'cancel';
      default: return 'radio_button_unchecked';
    }
  }
}
