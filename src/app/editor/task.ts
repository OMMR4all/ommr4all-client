import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {PageState} from './editor.service';
import {EventEmitter, Output} from '@angular/core';
import {catchError, delay, retry, retryWhen, switchMap} from 'rxjs/operators';
import {of, throwError} from 'rxjs';

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
    public code: TaskStatusCodes = TaskStatusCodes.Queued,
    public progress_code: TaskProgressCodes = TaskProgressCodes.INITIALIZING,
    public progress: number = -1,
    public accuracy: number = -1,
    public early_stopping_progress: number = -1,
    public loss: number = -1,
  ) {}
}

/**
 * Class to constantly poll the state of a task, but not its result.
 * Can not be used to launch or stop a task (see TaskWorker).
 */
export class TaskPoller {
  constructor(
    private taskUrl: string,
    private http: HttpClient,
    private pageState: PageState,
    public interval = 1000,
  ) {
    this.pollStatus();
  }

  private _taskError: HttpErrorResponse;
  get taskError() { return this._taskError; }

  private _taskStatus: TaskStatus;
  get status() { return this._taskStatus; }

  private _running = false;
  public get running() { return this._running; }

  public startStatusPoller() {
    this._running = true;
  }

  public stopStatusPoller() {
    this._running = false;
  }

  private pollStatus() {
    if (this._running) {
      this.http.get<{ status: TaskStatus, error: string }>(this.pageState.pageCom.operation_url(this.taskUrl, true)).subscribe(
        res => {
          this._taskStatus = res.status;
          this._taskError = null;
        },
        err => {
          this._taskStatus = null;
          this._taskError = err as HttpErrorResponse;
        }
      );
    }
    setTimeout(() => this.pollStatus(), this.interval);
  }
}

/**
 * Class to launch or cancel a task and request its result.
 * If you only want to poll/synchronize the current state of a task see TaskPoller.
 */
export class TaskWorker {
  @Output() taskFinished = new EventEmitter<any>();

  constructor(
    private taskUrl: string,
    private http: HttpClient,
    private pageState: PageState,
  ) {
  }

  private _taskStatus: TaskStatus;
  get status() { return this._taskStatus; }

  private _progressLabel = '';
  public get progressLabel() { return this._progressLabel; }

  private _running = false;
  public get running() { return this._running; }

  private _errorMessage = '';
  public get errorMessage() { return this._errorMessage; }

  public cancelTask() {
    return new Promise(((resolve, reject) => {
      this._running = false;
      this.http.delete(this.pageState.pageCom.operation_url(this.taskUrl)).subscribe(
        res => {
          resolve();
        },
        err => {
          reject();
        }

      );
    }));
  }

  public putTask() {
    this._progressLabel = 'Submitting task';
    // put task
    this.http.put<Response>(this.pageState.pageCom.operation_url(this.taskUrl), '').subscribe(
      res => {
        this._progressLabel = 'Task successfully submitted.';
        this.startStatusPoller();
      },
      err => {
        const resp = err as HttpErrorResponse;
        if (resp.status === 303) {
          this.startStatusPoller();
        } else {
          console.error(err);
          this.startStatusPoller();
        }
      }
    );
  }

  public startStatusPoller(interval = 500) {
    this._running = true;
    this.pollStatus(interval);
  }

  public stopStatusPoller() {
    this._running = false;
  }

  private pollStatus(interval) {
    if (!this.running) { return; }

    this.http.get<{ status: TaskStatus, error: string }>(this.pageState.pageCom.operation_url(this.taskUrl, false)).subscribe(
      res => {
        this._taskStatus = res.status;
        if (res.status.code === TaskStatusCodes.Finished) {
          this._progressLabel = 'Task finished';
          this.taskFinished.emit(res);
        } else if (res.status.code === TaskStatusCodes.Error) {
          this._progressLabel = 'Error.';
          this._errorMessage = 'Error during task execution.';
          console.error('Task finished with error: ' + res.error);
        } else if (res.status.code === TaskStatusCodes.NotFound) {
          this._errorMessage = 'Task not found.';
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
          setTimeout(() => this.pollStatus(interval), interval);
        }
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
        } else if (resp.status === 504) {
          this._errorMessage = 'Server cannot be found. Retrying.';
          setTimeout(() => this.pollStatus(interval), interval);
        } else if (resp.status === 400) {
          this._errorMessage = 'Operation not allowed.';
        } else if (resp.status === 404) {
          this._errorMessage = 'Page not found on server.';
        } else {
          this._errorMessage = 'Unknown error.';
        }
      }
    );
  }

}

