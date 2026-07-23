import {EventEmitter} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {TaskCancelledError, TaskWorker} from '../../../editor/task';
import {AlgorithmRequest, AlgorithmTypes, metaForAlgorithmType} from '../algorithm-predictor-params';
import {PageSelection} from '../page-selection';
import {BookCommunication} from '../../../data-types/communication';
import {ApiError} from '../../../utils/api-error';
import {OneClickWorkflowConfig, WorkflowStep} from './workflow-config';

export enum WorkflowRunState {
  Idle = 'idle',
  Running = 'running',
  Finished = 'finished',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export enum StepRunState {
  Pending = 'pending',
  Running = 'running',
  Done = 'done',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export class WorkflowRunStep {
  state = StepRunState.Pending;
  task: TaskWorker = null;   // created only when the step starts
  errorMessage = '';

  constructor(public readonly config: WorkflowStep) {}

  get label(): string {
    const meta = metaForAlgorithmType.get(this.config.algorithmType);
    return meta ? meta.label : this.config.algorithmType;
  }
}

/**
 * Runs the steps of a workflow strictly one after another. Each step is a
 * single-settle promise (TaskWorker.runToCompletion), so a step can neither
 * advance the chain twice nor keep polling after it ended. A failed step
 * aborts the chain.
 */
export class WorkflowRunner {
  readonly finished = new EventEmitter<boolean>();

  state = WorkflowRunState.Idle;
  steps: WorkflowRunStep[] = [];
  // guards the one-shot display-only recovery attempt (see attachRunningTask)
  recoveryAttempted = false;
  private _cancelRequested = false;

  constructor(
    private readonly http: HttpClient,
    private readonly book: BookCommunication,
  ) {}

  get running(): boolean { return this.state === WorkflowRunState.Running; }
  get failed(): boolean { return this.state === WorkflowRunState.Failed; }
  get cancelled(): boolean { return this.state === WorkflowRunState.Cancelled; }

  get currentStep(): WorkflowRunStep { return this.steps.find(s => s.state === StepRunState.Running); }
  get failedStep(): WorkflowRunStep { return this.steps.find(s => s.state === StepRunState.Failed); }
  get doneCount(): number { return this.steps.filter(s => s.state === StepRunState.Done).length; }

  get apiError(): ApiError {
    const failed = this.failedStep;
    return failed && failed.task ? failed.task.apiError : undefined;
  }

  get overallProgress(): number {
    if (this.steps.length === 0) { return 0; }
    const current = this.currentStep;
    const currentProgress = current && current.task ? Math.min(Math.max(current.task.status.progress, 0), 1) : 0;
    return (this.doneCount + currentProgress) / this.steps.length;
  }

  async run(config: OneClickWorkflowConfig, selection: PageSelection): Promise<void> {
    if (this.running) { return; }
    this.state = WorkflowRunState.Running;
    this._cancelRequested = false;
    this.steps = config.steps.filter(s => s.enabled).map(s => new WorkflowRunStep(s));

    for (const step of this.steps) {
      if (this._cancelRequested) {
        step.state = StepRunState.Cancelled;
        continue;
      }
      step.state = StepRunState.Running;
      const request = new AlgorithmRequest();
      request.store_to_pcgts = true;  // book-level workflow steps persist their results
      request.params = step.config.params;
      request.selection = selection;
      step.task = new TaskWorker(step.config.algorithmType, this.http, this.book, request);
      try {
        await step.task.runToCompletion();
        step.state = StepRunState.Done;
      } catch (e) {
        if (e instanceof TaskCancelledError) {
          step.state = StepRunState.Cancelled;
          this.state = WorkflowRunState.Cancelled;
          return;
        }
        step.state = StepRunState.Failed;
        step.errorMessage = e instanceof Error ? e.message : String(e);
        this.state = WorkflowRunState.Failed;
        return;
      }
    }

    this.state = this._cancelRequested ? WorkflowRunState.Cancelled : WorkflowRunState.Finished;
    if (this.state === WorkflowRunState.Finished) {
      this.finished.emit(true);
    }
  }

  /**
   * Display-only recovery after a page reload. The in-memory run loop is gone,
   * but the server may still be running a step. Given a still-running server
   * task (identified only by its algorithm type + task id, which is all the
   * global /tasks list exposes), rebuild the step list from the saved config:
   * the matching step is marked Running and re-attached to the live task for
   * progress display, earlier steps are marked Done and later steps stay
   * Pending. This does NOT resume the chain — when the running step finishes the
   * runner returns to Idle and the remaining steps are not started.
   * Returns true if a matching enabled step was found and attached.
   */
  attachRunningTask(config: OneClickWorkflowConfig, algorithmType: AlgorithmTypes, taskId: string): boolean {
    if (this.state !== WorkflowRunState.Idle || this.steps.length > 0) { return false; }
    const enabled = config.steps.filter(s => s.enabled);
    const idx = enabled.findIndex(s => s.algorithmType === algorithmType);
    if (idx < 0) { return false; }

    this.steps = enabled.map(s => new WorkflowRunStep(s));
    for (let i = 0; i < idx; i++) { this.steps[i].state = StepRunState.Done; }
    const current = this.steps[idx];
    current.state = StepRunState.Running;

    const request = new AlgorithmRequest();
    request.store_to_pcgts = true;
    request.params = current.config.params;
    // The page selection is unknown here, but workflow steps poll the book-level
    // task endpoint by task id, so it is not needed to display progress.
    current.task = new TaskWorker(algorithmType, this.http, this.book, request);
    current.task.taskFinished.subscribe(() => {
      if (current.state === StepRunState.Running) { current.state = StepRunState.Done; }
      // display-only: stop here, the later steps are not resumed
      this.state = WorkflowRunState.Idle;
    });
    current.task.attachToTask(taskId);
    this.state = WorkflowRunState.Running;
    return true;
  }

  cancel() {
    if (!this.running) { return; }
    this._cancelRequested = true;
    const current = this.currentStep;
    if (current && current.task) {
      current.task.cancelTask().catch(() => undefined);
    }
  }
}
