import {Component, ComponentRef, Inject, OnDestroy, OnInit} from '@angular/core';
import {TaskProgressCodes, TaskWorker} from '../../task';
import {ActionsService} from '../../actions/actions.service';
import {EditorService, PageState} from '../../editor.service';
import {Subject, Subscription} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

export interface TrainSymbolsDialogData {
  pageState: PageState;
  onClosed: any;
}

@Component({
  selector: 'app-train-symbols-dialog',
  templateUrl: './train-symbols-dialog.component.html',
  styleUrls: ['./train-symbols-dialog.component.css']
})
export class TrainSymbolsDialogComponent implements OnInit, OnDestroy {
  PC = TaskProgressCodes;
  private readonly _subscriptions = new Subscription();
  task: TaskWorker;

  constructor(
    private http: HttpClient,
    private editorService: EditorService,
    private dialogRef: MatDialogRef<TrainSymbolsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TrainSymbolsDialogData,
  ) {
    this.task = new TaskWorker('train_symbols', this.http, this.data.pageState);
  }

  ngOnInit() {
    this._subscriptions.add(this.task.taskFinished.subscribe(res => this.onTaskFinished(res)));
    this.task.putTask();
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  cancel() {
    this.task.cancelTask().then(() => this.close());
  }

  close() {
    if (this.data.onClosed) { this.data.onClosed(); }
    this.dialogRef.close();
  }

  get loss() { return this.task.status.loss; }
  get isWorking() { return this.task.status && this.task.status.progress_code === TaskProgressCodes.WORKING; }
  get accuracy() { return this.task.status.accuracy < 0 ? 0 : this.task.status.accuracy * 100; }

  private onTaskFinished(res: any) {
    this.close();
  }

}
