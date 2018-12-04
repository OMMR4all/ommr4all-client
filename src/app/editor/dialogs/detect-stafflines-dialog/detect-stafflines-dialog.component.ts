import {Component, ComponentRef, OnInit} from '@angular/core';
import {IModalDialog, IModalDialogButton, IModalDialogOptions} from 'ngx-modal-dialog';
import {TaskStatus, TaskStatusCodes} from '../../task';
import {Subject, throwError} from 'rxjs';
import {ActionType} from '../../actions/action-types';
import {MusicLine} from '../../../data-types/page/music-region/music-line';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {ActionsService} from '../../actions/actions.service';
import {PageState} from '../../editor.service';

@Component({
  selector: 'app-detect-stafflines-dialog',
  templateUrl: './detect-stafflines-dialog.component.html',
  styleUrls: ['./detect-stafflines-dialog.component.css']
})
export class DetectStaffLinesDialogComponent implements OnInit, IModalDialog {
  errorMessage = '';

  actionButtons: IModalDialogButton[];
  private closingSubject: Subject<void>;
  private pageState: PageState;
  private onClosed;
  private running = false;
  constructor(
    private http: HttpClient,
    private actions: ActionsService,
  ) {
    this.actionButtons = [
      { text: 'Cancel', buttonClass: 'btn btn-danger', onAction: () => this.cancelTask()} ,
    ];
  }

  ngOnInit() {
    this.putTask();
  }

  private close() {
    this.closingSubject.next();
    if (this.onClosed) { this.onClosed(); }
  }

  dialogInit(reference: ComponentRef<IModalDialog>, options: Partial<IModalDialogOptions<any>>) {
    this.closingSubject = options.closeDialogSubject;
    this.pageState = options.data.pageState;
    this.onClosed = options.data.onClosed;
  }

  private cancelTask() {
    return new Promise(((resolve, reject) => {
      this.running = false;
      this.http.delete(this.pageState.pageCom.operation_url('staffs')).subscribe(
        res => {
          resolve();
        },
        err => {
          reject();
        }

      );
    }));
  }


  private putTask() {
    // put task
    this.http.put<Response>(this.pageState.pageCom.operation_url('staffs'), '').subscribe(
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
    this.running = true;
    this.pollStatus(1000);
  }

  private pollStatus(interval) {
    if (!this.running) { return; }
    if (this.closingSubject.closed) { console.log('dialog closed'); return; }

    this.http.get<{ status: TaskStatus, staffs: Array<any>, error: string }>(this.pageState.pageCom.operation_url('staffs')).subscribe(
      res => {
        if (res.status.code === TaskStatusCodes.Finished) {
          if (!res.staffs) {
            console.error('No staffs transmitted.');
          } else {
            this.actions.startAction(ActionType.StaffLinesAutomatic);
            const staffs = res.staffs.map(json => MusicLine.fromJson(json, null));
            staffs.forEach(staff => {
              const mr = this.actions.addNewMusicRegion(this.pageState.pcgts.page);
              this.actions.attachMusicLine(mr, staff);
            });
            this.actions.finishAction();
          }
          // this.staffDetectionFinished.emit(this.pageState);
          this.close();
        } else if (res.status.code === TaskStatusCodes.Error) {
          console.error('Staff detection finished with error: ' + res.error);
        } else {
          console.log(res.status);
          setTimeout(() => this.pollStatus(interval), interval);
        }
      },
      err => {
        const resp = err as HttpErrorResponse;
        if (resp.status === 500) {
          const type = resp.error.error;
          if (type === 'no-model') {
            console.log('No model found');
          } else {
            console.log('Unknown server error');
          }
        } else if (resp.status === 504) {
          console.log('Server unreachable');
        } else if (resp.status === 404) {
          console.log('File not found');
        } else {
          console.log('Unknown status');
        }
      }
    );
  }

}
