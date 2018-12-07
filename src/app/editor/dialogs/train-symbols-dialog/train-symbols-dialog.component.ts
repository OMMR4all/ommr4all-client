import {Component, ComponentRef, OnInit} from '@angular/core';
import {IModalDialog, IModalDialogButton, IModalDialogOptions} from 'ngx-modal-dialog';
import {TaskProgressCodes, TaskWorker} from '../../task';
import {ActionsService} from '../../actions/actions.service';
import {EditorService, PageState} from '../../editor.service';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-train-symbols-dialog',
  templateUrl: './train-symbols-dialog.component.html',
  styleUrls: ['./train-symbols-dialog.component.css']
})
export class TrainSymbolsDialogComponent implements OnInit, IModalDialog {
  PC = TaskProgressCodes;
  task: TaskWorker;

  actionButtons: IModalDialogButton[];
  private closingSubject: Subject<void>;
  private pageState: PageState;
  private onClosed;
  constructor(
    private http: HttpClient,
    private editorService: EditorService,
  ) {
    this.actionButtons = [
      { text: 'Run in background', buttonClass: 'btn btn-primary', onAction: () => true } ,
      { text: 'Cancel', buttonClass: 'btn btn-danger', onAction: () => this.task.cancelTask()} ,
    ];
  }

  ngOnInit() {
    this.task.putTask();
  }

  get loss() { return this.task.status.loss; }
  get isWorking() { return this.task.status && this.task.status.progress_code === TaskProgressCodes.WORKING; }
  get accuracy() { return this.task.status.accuracy < 0 ? 0 : this.task.status.accuracy * 100; }

  private close() {
    this.closingSubject.next();
    if (this.onClosed) { this.onClosed(); }
  }

  dialogInit(reference: ComponentRef<IModalDialog>, options: Partial<IModalDialogOptions<any>>) {
    this.closingSubject = options.closeDialogSubject;
    this.pageState = options.data.pageState;
    this.onClosed = options.data.onClosed;
    this.task = new TaskWorker('train_symbols', this.http, this.pageState);
    this.task.taskFinished.subscribe(res => this.onTaskFinished(res));
  }

  private onTaskFinished(res: any) {
    this.close();
  }

}
