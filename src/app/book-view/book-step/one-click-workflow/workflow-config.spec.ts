import {OneClickWorkflowConfig, validateWorkflow, WorkflowStep} from './workflow-config';
import {AlgorithmTypes} from '../algorithm-predictor-params';

function config(...steps: WorkflowStep[]): OneClickWorkflowConfig {
  const c = new OneClickWorkflowConfig();
  c.steps = steps;
  return c;
}

describe('validateWorkflow', () => {
  it('allows continuing at a later stage: missing prereq from a prior run is a non-blocking warning', () => {
    // Layout + Symbols enabled, Preprocessing/Staff-lines disabled (done previously).
    const res = validateWorkflow(config(
      new WorkflowStep(AlgorithmTypes.LayoutSimpleLyrics),
      new WorkflowStep(AlgorithmTypes.SymbolsPCTorch),
    ).steps);

    expect(res.valid).toBe(true);
    expect(res.issues.some(i => i.severity === 'error')).toBe(false);
    // Layout requires Staff lines, produced by no enabled step -> warning on step 0.
    const warning = res.issues.find(i => i.severity === 'warning' && i.code === 'missing-requirement');
    expect(warning).toBeTruthy();
    expect(warning.stepIndex).toBe(0);
  });

  it('keeps a genuine mis-ordering as a blocking error', () => {
    // Symbols enabled before Layout, both enabled -> Layout produces the prereq later.
    const res = validateWorkflow(config(
      new WorkflowStep(AlgorithmTypes.SymbolsPCTorch),
      new WorkflowStep(AlgorithmTypes.LayoutSimpleLyrics),
    ).steps);

    expect(res.valid).toBe(false);
    const error = res.issues.find(i => i.severity === 'error' && i.code === 'missing-requirement');
    expect(error).toBeTruthy();
    expect(error.stepIndex).toBe(0);
  });

  it('reports an empty workflow as an error', () => {
    const step = new WorkflowStep(AlgorithmTypes.Preprocessing);
    step.enabled = false;
    const res = validateWorkflow(config(step).steps);

    expect(res.valid).toBe(false);
    expect(res.issues.some(i => i.code === 'empty-workflow')).toBe(true);
  });

  it('accepts a full ordered pipeline without issues', () => {
    const res = validateWorkflow(config(
      new WorkflowStep(AlgorithmTypes.Preprocessing),
      new WorkflowStep(AlgorithmTypes.StaffLinePCTorch),
      new WorkflowStep(AlgorithmTypes.LayoutSimpleLyrics),
      new WorkflowStep(AlgorithmTypes.SymbolsPCTorch),
    ).steps);

    expect(res.valid).toBe(true);
    expect(res.issues.length).toBe(0);
  });
});
