import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {PageState} from './editor.service';
import {EventEmitter, Output} from '@angular/core';

export enum TaskStatusCodes {
  Queued = 0,
  Running = 1,
  Finished = 2,
  Error = 3,
}

export enum TaskProgressCodes {
  INITIALIZING = 0,
  WORKING = 1,
  FINALIZING = 2,
}

export class TaskStatus {
  constructor(
    public code: TaskStatusCodes,
    public progress_code: TaskProgressCodes,
    public progress: number,
    public accuracy: number,
  ) {}
}


export class TaskWorker {
  @Output() taskFinished = new EventEmitter<any>();

  constructor(
    private taskUrl: string,
    private http: HttpClient,
    private pageState: PageState,
  ) {
  }

  private _progress = -1;
  public get progress() { return this._progress; }

  private _progressState = TaskStatusCodes.Queued;
  public get progressState() { return this._progressState; }

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
        this.startStatusPoller();
      },
      err => {
        const resp = err as HttpErrorResponse;
        if (resp.status === 303) {
          this.startStatusPoller();
        } else {
          console.error(err);
        }
      }
    );
  }

  private startStatusPoller() {
    this._running = true;
    this.pollStatus(500);
  }

  private pollStatus(interval) {
    if (!this.running) { return; }

    this.http.get<{ status: TaskStatus, error: string }>(this.pageState.pageCom.operation_url(this.taskUrl)).subscribe(
      res => {
        if (res.status.code === TaskStatusCodes.Finished) {
          this._progress = 100;
          this._progressLabel = 'Task finished';
          this.taskFinished.emit(res);
        } else if (res.status.code === TaskStatusCodes.Error) {
          this._progress = 0;
          this._progressLabel = 'Error.';
          this._errorMessage = 'Error during staff detection.';
          console.error('Staff detection finished with error: ' + res.error);
        } else {
          if (res.status.code === TaskStatusCodes.Queued) {
            this._progressLabel = 'Task queued. Waiting for ressources.';
          } else if (res.status.code === TaskStatusCodes.Running) {
            this._progress = res.status.progress;
            if (res.status.progress_code === TaskProgressCodes.INITIALIZING) {
              this._progressLabel = 'Initializing task.';
            } else if (res.status.progress_code === TaskProgressCodes.WORKING) {
              this._progressLabel = 'Working.';
            } else if (res.status.progress_code === TaskProgressCodes.FINALIZING) {
              this._progressLabel = 'finishing';
            }
          }

          console.log(res.status);
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
          this._errorMessage = 'Server cannot be found.';
        } else if (resp.status === 404) {
          this._errorMessage = 'Page not found on server.';
        } else {
          this._errorMessage = 'Unknown error.';
        }
      }
    );
  }

}

