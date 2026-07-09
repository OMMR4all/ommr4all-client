import {
  AlgorithmGroups,
  AlgorithmPredictorParams,
  AlgorithmTypes,
  algorithmGroupTypesMapping,
  labelForAlgorithmGroup,
  metaForAlgorithmType,
  oneClickPipelineGroups,
  stageInfoFor,
} from '../algorithm-predictor-params';
import type {BookMeta} from '../../../book-list.service';

export class WorkflowStep {
  algorithmType: AlgorithmTypes;
  params = new AlgorithmPredictorParams();
  enabled = true;

  constructor(algorithmType: AlgorithmTypes, params: AlgorithmPredictorParams = null, enabled = true) {
    this.algorithmType = algorithmType;
    if (params) { Object.assign(this.params, params); }
    this.enabled = enabled;
  }

  static fromJson(d: any): WorkflowStep {
    return new WorkflowStep(d.algorithmType, d.params, d.enabled !== false);
  }

  toJson(): any {
    return {
      algorithmType: this.algorithmType,
      params: this.params,
      enabled: this.enabled,
    };
  }
}

export class OneClickWorkflowConfig {
  steps: WorkflowStep[] = [];

  static fromJson(d: any): OneClickWorkflowConfig {
    if (!d || !Array.isArray(d) || d.length === 0) { return null; }
    const config = new OneClickWorkflowConfig();
    config.steps = d
      .filter(s => s && Object.values(AlgorithmTypes).includes(s.algorithmType))
      .map(s => WorkflowStep.fromJson(s));
    return config.steps.length > 0 ? config : null;
  }

  // Reproduces the former hardcoded pipeline: the default algorithm of each
  // pipeline group, with the params already stored per algorithm in the book.
  static defaultConfig(bookMeta: BookMeta): OneClickWorkflowConfig {
    const config = new OneClickWorkflowConfig();
    for (const group of oneClickPipelineGroups) {
      const types = algorithmGroupTypesMapping.get(group) || [];
      const type = types.find(t => {
        const meta = metaForAlgorithmType.get(t);
        return meta && meta.default;
      }) || types[0];
      if (type === undefined) { continue; }
      config.steps.push(new WorkflowStep(type, bookMeta.getAlgorithmParams(type)));
    }
    return config;
  }

  toJson(): any[] {
    return this.steps.map(s => s.toJson());
  }
}

export interface WorkflowIssue {
  severity: 'error' | 'warning';
  stepIndex: number;   // -1 for global issues
  code: 'missing-requirement' | 'redundant-stage' | 'empty-workflow';
  stages: AlgorithmGroups[];
  message: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  issues: WorkflowIssue[];
}

export function validateWorkflow(steps: WorkflowStep[]): WorkflowValidationResult {
  const issues: WorkflowIssue[] = [];
  const enabledSteps = steps
    .map((step, index) => ({step, index}))
    .filter(s => s.step.enabled);

  if (enabledSteps.length === 0) {
    issues.push({
      severity: 'error',
      stepIndex: -1,
      code: 'empty-workflow',
      stages: [],
      message: 'The workflow has no enabled steps.',
    });
    return {valid: false, issues};
  }

  const stageLabels = (stages: AlgorithmGroups[]) =>
    stages.map(s => labelForAlgorithmGroup.get(s) || s).join(', ');

  const produced = new Set<AlgorithmGroups>();
  for (const {step, index} of enabledSteps) {
    const info = stageInfoFor(step.algorithmType);
    const meta = metaForAlgorithmType.get(step.algorithmType);
    const label = meta ? meta.label : step.algorithmType;

    const missing = info.requires.filter(r => !produced.has(r));
    if (missing.length > 0) {
      issues.push({
        severity: 'error',
        stepIndex: index,
        code: 'missing-requirement',
        stages: missing,
        message: `"${label}" requires ${stageLabels(missing)}, which no earlier step produces.`,
      });
    }

    if (info.produces.length > 0 && info.produces.every(p => produced.has(p))) {
      issues.push({
        severity: 'warning',
        stepIndex: index,
        code: 'redundant-stage',
        stages: info.produces,
        message: `"${label}" is redundant: ${stageLabels(info.produces)} ${info.produces.length > 1 ? 'are' : 'is'} already produced by an earlier step.`,
      });
    }

    info.produces.forEach(p => produced.add(p));
  }

  return {valid: !issues.some(i => i.severity === 'error'), issues};
}
