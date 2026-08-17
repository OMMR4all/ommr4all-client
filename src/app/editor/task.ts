import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EventEmitter, Output, Directive, inject } from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {ApiError, apiErrorFromHttpErrorResponse} from '../utils/api-error';
import {AlgorithmTypes} from '../book-view/book-step/algorithm-predictor-params';
import {formatDuration} from '../utils/duration';

/**
 * A 401 while a task is running means the session expired, not that the task failed:
 * the server keeps working on it. Polling therefore continues, but slowly — every poll
 * bounces off the ErrorInterceptor, which sends the user to the login page.
 */
const SESSION_RETRY_INTERVAL_MS = 5000;
const SESSION_EXPIRED_LABEL =
  $localize`:@@sessionExpiredTaskLabel:Session expired. The task keeps running — please log in again.`;

export class TaskFailedError extends Error {
  constructor(message: string, public readonly apiError?: ApiError) {
    super(message);
  }
}

export class TaskCancelledError extends Error {
  constructor() { super('Task cancelled'); }
}

export interface OperationUrlProvider {
  operationTaskUrl(operation: AlgorithmTypes, taskId: string): string;
  operationUrl(operation: AlgorithmTypes, sub: string, statusOnly: boolean): string;
}

export enum TaskStatusCodes {
  Queued = 0,
  Running = 1,
  Finished = 2,
  Error = 3,
  NotFound = 4,
}

export const taskStatusCodeLabels = new Map<TaskStatusCodes, string>([
  [TaskStatusCodes.Queued, 'Queued'],
  [TaskStatusCodes.Running, 'Running'],
  [TaskStatusCodes.Finished, 'Finished'],
  [TaskStatusCodes.Error, 'Error'],
  [TaskStatusCodes.NotFound, 'Not found'],
]);

export enum TaskProgressCodes {
  INITIALIZING = 0,
  WORKING = 1,
  FINALIZING = 2,
  RESOLVING_DATA = 3,
  LOADING_DATA = 4,
  PREPARING_TRAINING = 5,
}

/** A page the server could not process. The task itself still succeeded. */
export interface SkippedPage {
  page: string;
  book?: string;
  error: string;
}

/** Body of a finished task response: the algorithm result plus its status. */
export interface TaskResult {
  status: TaskStatus;
  error?: string;
  skipped_pages?: SkippedPage[];
}

export class TaskStatus {
  constructor(
    public code: TaskStatusCodes = TaskStatusCodes.NotFound,
    public progress_code: TaskProgressCodes = TaskProgressCodes.INITIALIZING,
    public progress = -1,
    public accuracy = -1,
    public early_stopping_progress = -1,
    public loss = -1,
    public n_processed = 0,
    public n_total = 0,
    // while queued: number of tasks ahead competing for the same worker
    // resources (0 = next in line); -1 = unknown (e.g. older server)
    public queue_position = -1,
    // seconds spent waiting in the queue, frozen once the task starts; -1 = unknown
    public queued_time = -1,
    // seconds spent executing, frozen at the total duration once the task ended;
    // -1 = not started yet
    public run_time = -1,
  ) {}
}

export function queuedProgressLabel(status: TaskStatus): string {
  if (status.queue_position === 0) {
    return 'Task queued. Next in line.';
  } else if (status.queue_position > 0) {
    return 'Task queued. ' + status.queue_position + ' task(s) ahead.';
  }
  return 'Task queued. Waiting for resources.';
}

/**
 * Class to launch or cancel a task and request its result.
 * If you only want to poll/synchronize the current state of a task see TaskPoller.
 */
@Directive()
export class TaskWorker {

  constructor(
    private algorithmType: AlgorithmTypes,
    private http: HttpClient,
    private operationUrl: OperationUrlProvider,
    private _requestBody: any = {}
  ) {}
  @Output() taskFinished = new EventEmitter<any>();
  @Output() taskNotFound = new EventEmitter();
  @Output() taskAlreadyStarted = new EventEmitter();



  private _defaultPollingInterval = 500;
  private _taskId = '';
  private _cancelled = false;
  // client-side fallback for the elapsed time, see runSeconds
  private _submittedAtMs = 0;

  // If the poller is started manually it won't be stopped if the task is finished and try to find an existing job (e. g. training)
  private _statusPollerManual = false;

  get requestBody() { return this._requestBody; }

  private _taskStatus = new TaskStatus();
  get status() { return this._taskStatus; }

  private _progressLabel = '';
  public get progressLabel() { return this._progressLabel; }

  private _statusPollerRunning = false;
  public get statusPollerRunning() { return this._statusPollerRunning; }

  private _errorMessage = '';
  public get errorMessage() { return this.apiError ? this.apiError.userMessage : this._errorMessage; }

  private _apiError?: ApiError;
  public get apiError() { return this._apiError; }
  dismissError() { this._apiError = undefined; this._errorMessage = ''; }

  get taskStatusQueued() { return this._taskStatus.code === TaskStatusCodes.Queued; }
  get taskStatusError() { return this._taskStatus.code === TaskStatusCodes.Error; }
  get taskStatusUnavailable() { return this._taskStatus.code === TaskStatusCodes.NotFound; }
  get taskStatusFinished() { return this._taskStatus.code === TaskStatusCodes.Finished; }
  get taskStatusRunning() { return !this.taskStatusError && !this.taskStatusUnavailable && !this.taskStatusFinished; }

  resetError() { this._errorMessage = ''; }

  get loss() { return this.status.loss; }
  get isWorking() { return this.status && this.status.progress_code === TaskProgressCodes.WORKING; }
  get accuracy() { return this.status.accuracy < 0 ? 0 : this.status.accuracy * 100; }

  /** Seconds spent waiting in the queue, or -1 if the server did not report it. */
  get queuedSeconds() { return this.status ? this.status.queued_time : -1; }

  /**
   * Seconds the task has been (or was) executing. Prefers the server value, which
   * survives a page reload and excludes the queue wait, and falls back to the time
   * since submission when the server does not report one (older server, or the
   * 404 race in runToCompletion where the task record is already gone).
   */
  get runSeconds() {
    if (this.status && this.status.run_time >= 0) { return this.status.run_time; }
    if (this._submittedAtMs === 0) { return -1; }
    return (Date.now() - this._submittedAtMs) / 1000;
  }

  /** The plain run duration, e.g. '3m 07s' (empty when unknown). */
  get runDurationLabel(): string { return formatDuration(this.runSeconds); }

  /** Short timing note shown next to the progress label. */
  get timingLabel(): string {
    if (this.taskStatusQueued) {
      const waiting = formatDuration(this.queuedSeconds);
      return waiting ? 'waiting ' + waiting : '';
    }
    const elapsed = formatDuration(this.runSeconds);
    if (!elapsed) { return ''; }
    return this.taskStatusFinished || this.taskStatusError ? 'took ' + elapsed : elapsed;
  }

  public cancelTask(): Promise<void> {
    this._cancelled = true;
    this._statusPollerRunning = false;
    this._taskStatus = new TaskStatus();

    // Use .toPromise() instead of firstValueFrom
    return this.http.delete<void>(
      this.operationUrl.operationTaskUrl(this.algorithmType, this._taskId)
    ).toPromise();
  }

  /**
   * Submits the task and polls its status until it finishes. In contrast to
   * putTask/startStatusPoller this settles exactly once: it resolves on
   * success and throws TaskFailedError/TaskCancelledError otherwise, and no
   * polling happens outside the returned promise.
   */
  public async runToCompletion(intervalMs = 1000): Promise<TaskResult> {
    const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
    this._cancelled = false;
    this._taskStatus = new TaskStatus();
    this._submittedAtMs = Date.now();
    this.dismissError();
    this._progressLabel = 'Submitting task';
    this._taskId = await this.submitTask();
    this._progressLabel = 'Task successfully submitted.';

    while (true) {
      if (this._cancelled) { throw new TaskCancelledError(); }
      let res: TaskResult;
      try {
        res = await firstValueFrom(this.http.post<TaskResult>(
          this.operationUrl.operationTaskUrl(this.algorithmType, this._taskId), this._requestBody));
      } catch (err) {
        const resp = err as HttpErrorResponse;
        if (resp.status === 504) {
          // server temporarily unreachable, retry
          this._errorMessage = 'Server cannot be found. Retrying.';
          await delay(intervalMs);
          continue;
        } else if (resp.status === 401) {
          // The session expired mid-run. The task itself keeps running on the server,
          // so this is not a failure of the workflow: report it plainly and keep
          // polling (slowly) until the user has logged in again, then just continue.
          this._apiError = apiErrorFromHttpErrorResponse(resp);
          this._progressLabel = SESSION_EXPIRED_LABEL;
          await delay(SESSION_RETRY_INTERVAL_MS);
          continue;
        } else if (resp.status === 404) {
          // task record gone, i.e., already finished
          this._taskStatus = new TaskStatus(TaskStatusCodes.Finished);
          this._progressLabel = 'Task finished';
          this.taskFinished.emit(undefined);
          return {status: this._taskStatus};
        } else {
          this._apiError = apiErrorFromHttpErrorResponse(resp);
          this._taskStatus.code = TaskStatusCodes.Error;
          throw new TaskFailedError(this._apiError.userMessage || 'Task failed.', this._apiError);
        }
      }

      // the poll went through, so any transient error (expired session, unreachable
      // server) is resolved -- drop it so the UI stops showing a stale message
      this.dismissError();
      this._taskStatus = res.status;
      if (res.status.code === TaskStatusCodes.Finished) {
        this._progressLabel = 'Task finished';
        this.taskFinished.emit(res);
        return res;
      } else if (res.status.code === TaskStatusCodes.Error) {
        this._progressLabel = 'Error.';
        this._errorMessage = 'Error during task execution.';
        throw new TaskFailedError(res.error || 'Error during task execution.');
      } else if (res.status.code === TaskStatusCodes.NotFound) {
        this._errorMessage = 'Task not found.';
        this.taskNotFound.emit();
        throw new TaskFailedError('Task not found.');
      } else if (res.status.code === TaskStatusCodes.Queued) {
        this._progressLabel = queuedProgressLabel(res.status);
      } else if (res.status.code === TaskStatusCodes.Running) {
        if (res.status.progress_code === TaskProgressCodes.INITIALIZING) {
          this._progressLabel = 'Initializing task.';
        } else if (res.status.progress_code === TaskProgressCodes.WORKING) {
          this._progressLabel = 'Working.';
        } else if (res.status.progress_code === TaskProgressCodes.FINALIZING) {
          this._progressLabel = 'finishing';
        }
      }
      await delay(intervalMs);
    }
  }

  private async submitTask(): Promise<string> {
    try {
      const res = await firstValueFrom(this.http.put<{task_id: string}>(
        this.operationUrl.operationUrl(this.algorithmType, '', false), this._requestBody));
      return res.task_id;
    } catch (err) {
      const resp = err as HttpErrorResponse;
      if (resp.status === 303 && resp.error && resp.error.task_id) {
        // task already started
        this.taskAlreadyStarted.emit();
        return resp.error.task_id;
      }
      this._apiError = apiErrorFromHttpErrorResponse(resp);
      throw new TaskFailedError(this._apiError.userMessage || 'Task could not be submitted.', this._apiError);
    }
  }

  public putTask(body = null, initialRequest = null) {
    this._taskStatus = new TaskStatus();
    this._submittedAtMs = Date.now();
    if (body !== null) { this._requestBody = body; }
    if (!initialRequest) {
      initialRequest = this._requestBody;
    }
    this._progressLabel = 'Submitting task';
    this.dismissError();
    // put task
    this.http.put<{task_id: string}>(this.operationUrl.operationUrl(this.algorithmType, '', false), initialRequest).subscribe(
      res => {
        this._progressLabel = 'Task successfully submitted.';
        this._taskId = res.task_id;
        this.startStatusPoller(this._defaultPollingInterval, false);
      },
      err => {
        const resp = err as HttpErrorResponse;
        if (resp.status === 303) {
          // task already started
          this._taskId = err.error.task_id;
          this.startStatusPoller(this._defaultPollingInterval, false);
          this.taskAlreadyStarted.emit();
        } else {
          // without this the submission failed silently (console only) and the UI
          // just sat there -- a 401 in particular looked like nothing had happened
          this._apiError = apiErrorFromHttpErrorResponse(resp);
          this._progressLabel = resp.status === 401 ? SESSION_EXPIRED_LABEL : 'Task could not be submitted.';
          console.error(err);
        }
      }
    );
  }

  /**
   * Attach to an already-running task (e.g. one discovered from the global task
   * list after a page reload) and poll its status without submitting a new one.
   * Display-only: the poller stops on its own once the task finishes.
   */
  public attachToTask(taskId: string, interval = this._defaultPollingInterval) {
    this._taskId = taskId;
    // the task started before this client did: only the server knows when, so no
    // local fallback is set here (runSeconds then reports the server value only)
    this.dismissError();
    this.startStatusPoller(interval, false);
  }

  public startStatusPoller(interval, manual = true) {
    if (this._statusPollerRunning) { return; }
    this._statusPollerRunning = true;
    this._statusPollerManual = manual;
    this.pollStatus(interval);
  }

  public stopStatusPoller(manual = true) {
    this._taskId = '';
    if (manual) {
      this._statusPollerRunning = false;
      this._statusPollerManual = false;
    } else if (!this._statusPollerManual) {
      this._statusPollerRunning = false;
    }
  }

  private pollStatus(interval) {
    if (!this.statusPollerRunning) { return; }

    if (this._taskId.length === 0) {
      // no task ID yet, ask for it
      this.http.post<{task_id: string}>(this.operationUrl.operationUrl(this.algorithmType, '', false), this._requestBody).subscribe(
        r => {
          this._taskId = r.task_id;
          // poll again, immediately to get current status as fast as possible
          this.pollStatus(interval);
        },
        err => {
          setTimeout(() => this.pollStatus(interval), interval);
        });
      return;
    }

    this.http.post<{ status: TaskStatus, error: string }>(this.operationUrl.operationTaskUrl(this.algorithmType, this._taskId), this._requestBody).subscribe(
      res => {
        // the poll went through, so any transient error (expired session, unreachable
        // server) is resolved -- drop it so the UI stops showing a stale message
        this.dismissError();
        this._taskStatus = res.status;
        if (res.status.code === TaskStatusCodes.Finished) {
          this._progressLabel = 'Task finished';
          this.taskFinished.emit(res);
          this.stopStatusPoller(false);
        } else if (res.status.code === TaskStatusCodes.Error) {
          this._progressLabel = 'Error.';
          this._errorMessage = 'Error during task execution.';
          console.error('Task finished with error: ' + res.error);
          this.stopStatusPoller(false);
        } else if (res.status.code === TaskStatusCodes.NotFound) {
          this._errorMessage = 'Task not found.';
          this.taskNotFound.emit();
          this.stopStatusPoller(false);
        } else {
          if (res.status.code === TaskStatusCodes.Queued) {
            this._progressLabel = queuedProgressLabel(res.status);
          } else if (res.status.code === TaskStatusCodes.Running) {
            if (res.status.progress_code === TaskProgressCodes.INITIALIZING) {
              this._progressLabel = 'Initializing task.';
            } else if (res.status.progress_code === TaskProgressCodes.WORKING) {
              this._progressLabel = 'Working.';
            } else if (res.status.progress_code === TaskProgressCodes.FINALIZING) {
              this._progressLabel = 'finishing';
            }
          }
        }
        // poll status (if manually started it might not be stopped)
        setTimeout(() => this.pollStatus(interval), interval);
      },
      err => {
        const resp = err as HttpErrorResponse;
        const error = err.error as ApiError;
        // The session expired: the task itself is unaffected and keeps running on the
        // server, so keep the status intact and keep polling (slowly) instead of
        // reporting a task error. Once the user logs in again the poll just succeeds.
        if (resp.status === 401) {
          this._apiError = apiErrorFromHttpErrorResponse(resp);
          this._progressLabel = SESSION_EXPIRED_LABEL;
          setTimeout(() => this.pollStatus(interval), SESSION_RETRY_INTERVAL_MS);
          return;
        }
        this._taskStatus.code = TaskStatusCodes.Error;
        if (error && error.errorCode) {
          this._apiError = error;
          this.taskFinished.emit(undefined);
          this.stopStatusPoller(false);
        } else if (resp.status === 500) {
          this._apiError = apiErrorFromHttpErrorResponse(resp);
          this._errorMessage = this._apiError.userMessage;
          this.taskFinished.emit(undefined);
          this.stopStatusPoller(false);
        } else if (resp.status === 504) {
          this._errorMessage = 'Server cannot be found. Retrying.';
        } else if (resp.status === 400) {
          this._errorMessage = 'Operation not allowed.';
          this.stopStatusPoller(false);
        } else if (resp.status === 404) {
          this._taskStatus.code = TaskStatusCodes.NotFound;
          this.taskFinished.emit(undefined);  // task not found, i.e., already finished
          this.stopStatusPoller(false);
        } else {
          this._errorMessage = 'Unknown error.';
          this.stopStatusPoller(false);
        }
        // poll status (if manually started it might not be stopped)
        setTimeout(() => this.pollStatus(interval), interval);
      }
    );
  }

}

