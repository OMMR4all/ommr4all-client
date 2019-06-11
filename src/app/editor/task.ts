import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {PageState} from './editor.service';
import {EventEmitter, Output} from '@angular/core';
import {catchError, delay, retry, retryWhen, switchMap} from 'rxjs/operators';
import {of, throwError} from 'rxjs';

export interface OperationUrlProvider {
  operationTaskUrl(operation: string, taskId: string): string;
  operationUrl(operation: string, statusOnly: boolean): string;
}

export enum TaskStatusCodes {
  Queued = 0,
  Running = 1,
  Finished = 2,
  Error = 3,
  NotFound = 4,
}

export enum TaskProgressCodes {
  INITIALIZING = 0,
  WORKING = 1,
  FINALIZING = 2,
}

export class TaskStatus {
  constructor(
    public code: TaskStatusCodes = TaskStatusCodes.NotFound,
    public progress_code: TaskProgressCodes = TaskProgressCodes.INITIALIZING,
    public progress: number = -1,
    public accuracy: number = -1,
    public early_stopping_progress: number = -1,
    public loss: number = -1,
  ) {}
}

/**
 * Class to launch or cancel a task and request its result.
 * If you only want to poll/synchronize the current state of a task see TaskPoller.
 */
export class TaskWorker {
  @Output() taskFinished = new EventEmitter<any>();
  @Output() taskNotFound = new EventEmitter();
  @Output() taskAlreadyStarted = new EventEmitter();

  private _defaultPollingInterval = 500;
  private _taskId = '';

  // If the poller is started manually it won't be stopped if the task is finished and try to find an existing job (e. g. training)
  private _statusPollerManual = false;

  constructor(
    private taskUrl: string,
    private http: HttpClient,
    private operationUrl: OperationUrlProvider,
  ) {
  }

  private _taskStatus = new TaskStatus();
  get status() { return this._taskStatus; }

  private _progressLabel = '';
  public get progressLabel() { return this._progressLabel; }

  private _statusPollerRunning = false;
  public get statusPollerRunning() { return this._statusPollerRunning; }

  private _errorMessage = '';
  public get errorMessage() { return this._errorMessage; }

  get taskStatusError() { return this._taskStatus.code === TaskStatusCodes.Error; }
  get taskStatusUnavailable() { return this._taskStatus.code === TaskStatusCodes.NotFound; }
  get taskStatusFinished() { return this._taskStatus.code === TaskStatusCodes.Finished; }
  get taskStatusRunning() { return !this.taskStatusError && !this.taskStatusUnavailable && !this.taskStatusFinished; }

  resetError() { this._errorMessage = ''; }

  get loss() { return this.status.loss; }
  get isWorking() { return this.status && this.status.progress_code === TaskProgressCodes.WORKING; }
  get accuracy() { return this.status.accuracy < 0 ? 0 : this.status.accuracy * 100; }

  public cancelTask() {
    return new Promise(((resolve, reject) => {
      this._statusPollerRunning = false;
      this._taskStatus = new TaskStatus();
      this.http.delete(this.operationUrl.operationTaskUrl(this.taskUrl, this._taskId)).subscribe(
        res => {
          resolve();
        },
        err => {
          reject();
        }
      );
    }));
  }

  public putTask(body = {}) {
    this._progressLabel = 'Submitting task';
    // put task
    this.http.put<{task_id: string}>(this.operationUrl.operationUrl(this.taskUrl, false), body).subscribe(
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
          console.error(err);
        }
      }
    );
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
      this.http.post<{task_id: string}>(this.operationUrl.operationUrl(this.taskUrl, false), {}).subscribe(
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

    this.http.post<{ status: TaskStatus, error: string }>(this.operationUrl.operationTaskUrl(this.taskUrl, this._taskId), {}).subscribe(
      res => {
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
            this._progressLabel = 'Task queued. Waiting for resources.';
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
        if (resp.status === 500) {
          const type = resp.error.error;
          if (type === 'no-model') {
            this._errorMessage = 'No model trained yet.';
          } else {
            this._errorMessage = 'Unknown server error.';
          }
          this.stopStatusPoller(false);
        } else if (resp.status === 504) {
          this._errorMessage = 'Server cannot be found. Retrying.';
        } else if (resp.status === 400) {
          this._errorMessage = 'Operation not allowed.';
          this.stopStatusPoller(false);
        } else if (resp.status === 404) {
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

