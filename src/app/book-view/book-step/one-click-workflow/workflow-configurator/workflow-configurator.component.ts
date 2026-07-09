import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {
  AlgorithmGroups,
  AlgorithmTypes,
  algorithmGroupTypesMapping,
  labelForAlgorithmGroup,
  metaForAlgorithmType,
  oneClickPipelineGroups,
  optionalPipelineGroups,
} from '../../algorithm-predictor-params';
import {BookCommunication} from '../../../../data-types/communication';
import {BookMeta} from '../../../../book-list.service';
import {OneClickWorkflowConfig, validateWorkflow, WorkflowIssue, WorkflowStep, WorkflowValidationResult} from '../workflow-config';

@Component({
    selector: 'app-workflow-configurator',
    templateUrl: './workflow-configurator.component.html',
    styleUrls: ['./workflow-configurator.component.scss'],
    standalone: false
})
export class WorkflowConfiguratorComponent {
  @Input() config: OneClickWorkflowConfig;
  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;
  @Input() disabled = false;

  @Output() configChange = new EventEmitter<void>();

  get validation(): WorkflowValidationResult { return validateWorkflow(this.config.steps); }
  get globalIssues(): WorkflowIssue[] { return this.validation.issues.filter(i => i.stepIndex === -1); }

  issuesFor(index: number): WorkflowIssue[] {
    return this.validation.issues.filter(i => i.stepIndex === index);
  }

  private groupsToMenuEntries(groups: AlgorithmGroups[]): {group: AlgorithmGroups, label: string, types: AlgorithmTypes[]}[] {
    return groups
      .map(group => ({
        group,
        label: labelForAlgorithmGroup.get(group) || (group as string),
        types: algorithmGroupTypesMapping.get(group) || [],
      }))
      .filter(g => g.types.length > 0);
  }

  get addStepGroups() { return this.groupsToMenuEntries(oneClickPipelineGroups); }
  get addSpecialStepGroups() { return this.groupsToMenuEntries(optionalPipelineGroups); }

  labelForType(t: AlgorithmTypes): string {
    const meta = metaForAlgorithmType.get(t);
    return meta ? meta.label : t;
  }

  drop(event: CdkDragDrop<WorkflowStep[]>) {
    if (event.previousIndex === event.currentIndex) { return; }
    moveItemInArray(this.config.steps, event.previousIndex, event.currentIndex);
    this.configChange.emit();
  }

  addStep(t: AlgorithmTypes) {
    this.config.steps.push(new WorkflowStep(t, this.bookMeta.getAlgorithmParams(t)));
    this.configChange.emit();
  }

  removeStep(index: number) {
    this.config.steps.splice(index, 1);
    this.configChange.emit();
  }

  moveStep(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= this.config.steps.length) { return; }
    moveItemInArray(this.config.steps, index, target);
    this.configChange.emit();
  }
}
