import {Component, EventEmitter, Input, Output} from '@angular/core';
import {
  AlgorithmGroups,
  AlgorithmPredictorParams,
  AlgorithmTypes,
  algorithmGroupTypesMapping,
  algorithmTypesGroupMapping,
  labelForAlgorithmGroup,
  metaForAlgorithmType,
  stageInfoFor,
} from '../../algorithm-predictor-params';
import {BookCommunication} from '../../../../data-types/communication';
import {BookMeta} from '../../../../book-list.service';
import {WorkflowIssue, WorkflowStep} from '../workflow-config';

@Component({
    selector: 'app-workflow-step-card',
    templateUrl: './workflow-step-card.component.html',
    styleUrls: ['./workflow-step-card.component.scss'],
    standalone: false
})
export class WorkflowStepCardComponent {
  @Input() step: WorkflowStep;
  @Input() index: number;
  @Input() issues: WorkflowIssue[] = [];
  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;
  @Input() disabled = false;
  @Input() first = false;
  @Input() last = false;

  @Output() stepChange = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
  @Output() moveUp = new EventEmitter<void>();
  @Output() moveDown = new EventEmitter<void>();

  settingsOpen = false;

  get group(): AlgorithmGroups { return algorithmTypesGroupMapping.get(this.step.algorithmType); }
  get groupLabel(): string { return labelForAlgorithmGroup.get(this.group) || this.group; }
  get alternatives(): AlgorithmTypes[] { return algorithmGroupTypesMapping.get(this.group) || [this.step.algorithmType]; }
  get producedStages(): string[] {
    return stageInfoFor(this.step.algorithmType).produces.map(s => labelForAlgorithmGroup.get(s) || s);
  }
  get errors(): WorkflowIssue[] { return this.issues.filter(i => i.severity === 'error'); }
  get warnings(): WorkflowIssue[] { return this.issues.filter(i => i.severity === 'warning'); }

  labelForType(t: AlgorithmTypes): string {
    const meta = metaForAlgorithmType.get(t);
    return meta ? meta.label : t;
  }

  get description(): string {
    const meta = metaForAlgorithmType.get(this.step.algorithmType);
    return meta ? meta.description : '';
  }

  onTypeChange(t: AlgorithmTypes) {
    if (t === this.step.algorithmType) { return; }
    this.step.algorithmType = t;
    // re-seed the params with the ones stored for the newly selected algorithm
    this.step.params = new AlgorithmPredictorParams();
    Object.assign(this.step.params, this.bookMeta.getAlgorithmParams(t));
    this.stepChange.emit();
  }

  onEnabledChange() {
    this.stepChange.emit();
  }
}
