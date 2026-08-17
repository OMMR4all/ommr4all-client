import {EventEmitter} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {SkippedPage, TaskCancelledError, TaskResult, TaskWorker} from '../../../editor/task';
import {AlgorithmRequest, AlgorithmTypes, metaForAlgorithmType} from '../algorithm-predictor-params';
import {PageSelection} from '../page-selection';
import {BookCommunication} from '../../../data-types/communication';
import {ApiError} from '../../../utils/api-error';
import {OneClickWorkflowConfig, WorkflowStep} from './workflow-config';
import {formatDuration} from '../../../utils/duration';

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
  skippedPages: SkippedPage[] = [];
  startedAtMs = 0;
  finishedAtMs = 0;

  constructor(public readonly config: WorkflowStep) {}

  /** Wall-clock seconds of this step: live while running, frozen once it ended. */
  get durationSeconds(): number {
    // after a reload (attachRunningTask) this client never saw the step start, so
    // fall back to the server-reported run time of the task
    if (this.startedAtMs === 0) { return this.task ? this.task.runSeconds : -1; }
    return ((this.finishedAtMs || Date.now()) - this.startedAtMs) / 1000;
  }

  get durationLabel(): string { return formatDuration(this.durationSeconds); }

  get label(): string {
    const meta = metaForAlgorithmType.get(this.config.algorithmType);
    return meta ? meta.label : this.config.algorithmType;
  }

  get skippedPageNames(): string { return this.skippedPages.map(p => p.page).join(', '); }
  get skippedPageErrors(): string { return this.skippedPages.map(p => p.page + ': ' + p.error).join('\n'); }
}

/** Reads the skipped_pages report of a finished task response, if any. */
function skippedPagesOf(res: TaskResult): SkippedPage[] {
  return res && Array.isArray(res.skipped_pages) ? res.skipped_pages : [];
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
  // wall clock of the whole run. Measured client-side because a run spans several
  // server tasks and no single one of them knows the total.
  startedAtMs = 0;
  finishedAtMs = 0;
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
    if (failed && failed.task) { return failed.task.apiError; }
    // a still-running step can carry an error too: an expired session does not fail
    // the run (the server keeps working), but the user has to be told about it
    const current = this.currentStep;
    return current && current.task ? current.task.apiError : undefined;
  }

  /** Seconds since the run started: live while running, frozen once it ended. */
  get elapsedSeconds(): number {
    if (this.startedAtMs === 0) { return -1; }
    return ((this.finishedAtMs || Date.now()) - this.startedAtMs) / 1000;
  }

  get elapsedLabel(): string { return formatDuration(this.elapsedSeconds); }

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
    this.startedAtMs = Date.now();
    this.finishedAtMs = 0;
    this.steps = config.steps.filter(s => s.enabled).map(s => new WorkflowRunStep(s));

    for (const step of this.steps) {
      if (this._cancelRequested) {
        step.state = StepRunState.Cancelled;
        continue;
      }
      step.state = StepRunState.Running;
      step.startedAtMs = Date.now();
      const request = new AlgorithmRequest();
      request.store_to_pcgts = true;  // book-level workflow steps persist their results
      request.params = step.config.params;
      request.selection = selection;
      step.task = new TaskWorker(step.config.algorithmType, this.http, this.book, request);
      try {
        const res = await step.task.runToCompletion();
        step.skippedPages = skippedPagesOf(res);
        step.finishedAtMs = Date.now();
        step.state = StepRunState.Done;
      } catch (e) {
        step.finishedAtMs = Date.now();
        this.finishedAtMs = step.finishedAtMs;
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

    this.finishedAtMs = Date.now();
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
    current.task.taskFinished.subscribe(res => {
      current.skippedPages = skippedPagesOf(res);
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
