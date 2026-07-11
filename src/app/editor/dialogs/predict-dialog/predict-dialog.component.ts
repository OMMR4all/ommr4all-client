import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import {Subscription} from 'rxjs';
import {TaskWorker} from '../../task';
import { HttpClient } from '@angular/common/http';
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
    styleUrls: ['./predict-dialog.component.scss'],
    standalone: false
})
export class PredictDialogComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private actions = inject(ActionsService);
  private dialogRef = inject<MatDialogRef<PredictDialogComponent>>(MatDialogRef);
  data = inject<PredictData>(MAT_DIALOG_DATA);

  private readonly _subscriptions = new Subscription();
  task: TaskWorker;

  get algorithmName() { return labelForAlgorithmGroup.get(this.data.algorithmGroup); }

  @ViewChild(AlgorithmPredictorSettingsComponent) predictorSettings: AlgorithmPredictorSettingsComponent;

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
    requestBody.worker_resource = this.predictorSettings.workerResource;
    this.task = new TaskWorker(this.predictorSettings.algorithmType, this.http, this.data.pageState.pageCom);
    this.task.putTask(null, requestBody);
    this.task.taskFinished.subscribe(res => this.onTaskFinished(res));
  }

  private onTaskFinished(res) {
    this.close(res);
  }
}
