import {Component, ComponentRef, OnInit} from '@angular/core';
import {IModalDialog, IModalDialogButton, IModalDialogOptions} from 'ngx-modal-dialog';
import {TaskProgressCodes, TaskStatus, TaskStatusCodes, TaskWorker} from '../../task';
import {Subject} from 'rxjs';
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
  task: TaskWorker;
  actionButtons: IModalDialogButton[];

  private closingSubject: Subject<void>;
  private pageState: PageState;
  private onClosed;
  constructor(
    private http: HttpClient,
    private actions: ActionsService,
  ) {
    this.actionButtons = [
      { text: 'Cancel', buttonClass: 'btn btn-danger', onAction: () => this.task.cancelTask()} ,
    ];
  }

  ngOnInit() {
    this.task.putTask();
  }

  private close() {
    this.closingSubject.next();
    if (this.onClosed) { this.onClosed(); }
  }

  dialogInit(reference: ComponentRef<IModalDialog>, options: Partial<IModalDialogOptions<any>>) {
    this.closingSubject = options.closeDialogSubject;
    this.pageState = options.data.pageState;
    this.onClosed = options.data.onClosed;
    this.task = new TaskWorker('staffs', this.http, this.pageState);
    this.task.taskFinished.subscribe(res => this.onTaskFinished(res));
  }

  private onTaskFinished(res: {staffs: any}) {
    if (!res.staffs) {
      console.error('No staff transmitted');
    } else {
      this.actions.startAction(ActionType.StaffLinesAutomatic);
      const staffs = res.staffs.map(json => MusicLine.fromJson(json, null));
      staffs.forEach(staff => {
        const mr = this.actions.addNewMusicRegion(this.pageState.pcgts.page);
        this.actions.attachMusicLine(mr, staff);
      });
      this.actions.finishAction();
    }

    this.close();
  }
}
