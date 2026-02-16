import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {TaskWorker} from '../../task';
import {HttpClient} from '@angular/common/http';
import {ActionsService} from '../../actions/actions.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AlgorithmGroups,
  AlgorithmRequest,
  labelForAlgorithmGroup, metaForAlgorithmType,
} from '../../../book-view/book-step/algorithm-predictor-params';
import {PageState} from '../../editor.service';
import {AlgorithmPredictorSettingsComponent} from '../../../common/algorithm-steps/algorithm-predictor-settings/algorithm-predictor-settings.component';

export interface PredictData {
  pageState: PageState;
  algorithmGroup: AlgorithmGroups;
}

@Component({
  selector: 'app-predict-dialog',
  templateUrl: './predict-dialog.component.html',
  styleUrls: ['./predict-dialog.component.scss']
})
export class PredictDialogComponent implements OnInit, OnDestroy {
  private readonly _subscriptions = new Subscription();
  task: TaskWorker;

  get algorithmName() { return labelForAlgorithmGroup.get(this.data.algorithmGroup); }

  @ViewChild(AlgorithmPredictorSettingsComponent) predictorSettings: AlgorithmPredictorSettingsComponent;

  constructor(
    private http: HttpClient,
    private actions: ActionsService,
    private dialogRef: MatDialogRef<PredictDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PredictData,
  ) {
  }

  ngOnInit() {
    // this._subscriptions.add(this.task.taskFinished.subscribe(res => this.onTaskFinished(res)));
    // this._subscriptions.add(this.task.taskNotFound.subscribe(res => this.close()));
    // this._subscriptions.add(this.task.taskAlreadyStarted.subscribe(res => this.close()));
  }

  ngOnDestroy(): void {
    this.stop();
    this._subscriptions.unsubscribe();
  }

  cancel() {
    if (!this.task) { return; }
    this.task.cancelTask().then(() => {
      this.stop();
    }).catch(() => {
      this.stop();
    });
  }

  private close(result: any) {
    this.stop();
    this.dialogRef.close(result);
  }

  private stop() {
    if (this.task) {
      this.task.stopStatusPoller();
      this.task = undefined;
    }
  }

  run() {
    const requestBody = new AlgorithmRequest();
    requestBody.pcgts = this.data.pageState.pcgts.toJson();
    requestBody.params = this.predictorSettings.params;
    this.task = new TaskWorker(this.predictorSettings.algorithmType, this.http, this.data.pageState.pageCom);
    this.task.putTask(null, requestBody);
    this.task.taskFinished.subscribe(res => this.onTaskFinished(res));
  }

  private onTaskFinished(res) {
    this.close(res);
  }
}
