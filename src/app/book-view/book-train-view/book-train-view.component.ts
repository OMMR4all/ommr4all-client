import { Component, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import {TaskProgressCodes, TaskStatusCodes, TaskWorker} from '../../editor/task';
import { HttpClient } from '@angular/common/http';
import {BookCommunication} from '../../data-types/communication';
import {BookMeta} from '../../book-list.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {AvailableModels, ModelMeta} from '../../data-types/models';
import {ModelForBookSelectionComponent} from '../../common/algorithm-steps/model-for-book-selection/model-for-book-selection.component';
import {AlgorithmGroups, AlgorithmTypes} from '../book-step/algorithm-predictor-params';
import { MatStepper } from '@angular/material/stepper';

interface TrainSettings {
  pretrainedModel: ModelMeta;
  nTrain: number;
  includeAllTrainingData: boolean;
  symbol_enable_neume_training: boolean;
  symbol_enable_additional_symbol_types: boolean;
}

@Component({
    selector: 'app-book-train-view',
    templateUrl: './book-train-view.component.html',
    styleUrls: ['./book-train-view.component.css'],
    standalone: false
})
export class BookTrainViewComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  private static readonly toIndex = [TaskProgressCodes.INITIALIZING, TaskProgressCodes.RESOLVING_DATA, TaskProgressCodes.LOADING_DATA, TaskProgressCodes.PREPARING_TRAINING, TaskProgressCodes.WORKING, TaskProgressCodes.FINALIZING];

  private readonly _subscriptions = new Subscription();
  readonly TaskProgressCodes = TaskProgressCodes;
  readonly AT = AlgorithmTypes;

  @Input() book: BookCommunication;
  @Input() meta: BookMeta;
  @Input() operation: AlgorithmTypes;

  @ViewChild(ModelForBookSelectionComponent) modelSelection: ModelForBookSelectionComponent;
  @ViewChild(MatStepper, {static: true}) stepper: MatStepper;
  task: TaskWorker;

  taskFinishedSuccessfully = false;
  useCustomPretrainedModel = false;
  usePretrainedModel = true;

  trainSettings: TrainSettings = {
    pretrainedModel: null,
    nTrain: 0.8,
    includeAllTrainingData: false,

    symbol_enable_neume_training: false,
    symbol_enable_additional_symbol_types: false,
  };
  params = {
    trainParams: this.trainSettings,
  };

  get availableModels() { return this.modelSelection ? this.modelSelection.availableModels : null; }

  get selectedStepperIndex() {
    return BookTrainViewComponent.toIndex.indexOf(this.task.status ? this.task.status.progress_code : 0);
  }

  isCompleted(code: TaskProgressCodes) {
    return this.selectedStepperIndex > BookTrainViewComponent.toIndex.indexOf(code);
  }

  get selectedModelMeta(): ModelMeta {
    if (!this.usePretrainedModel) {
      return null;
    }
    if (this.useCustomPretrainedModel) {
      return this.params.trainParams.pretrainedModel;
    } else if (this.availableModels && this.availableModels.getValue()) {
      if (this.availableModels.getValue().default_book_style_model) {
        return this.availableModels.getValue().default_book_style_model;
      } else if (this.availableModels.getValue().selected_model) {
        return this.availableModels.getValue().selected_model;
      } else if (this.availableModels.getValue().book_models.length > 0) {
        return this.availableModels.getValue().book_models[0];
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  set selectedModelMeta(m: ModelMeta) {
    if (this.useCustomPretrainedModel || !this.params.trainParams.pretrainedModel) {
      this.params.trainParams.pretrainedModel = m;
    }
  }

  ngOnInit() {
    this.task = new TaskWorker(this.operation, this.http, this.book, this.params);
    this.task.startStatusPoller(2000);
    this._subscriptions.add(this.task.taskFinished.subscribe(r => {
      if (!r) {
        this.task.cancelTask();
      } else {
        this.taskFinishedSuccessfully = true;
      }
      this.modelSelection.refresh();
    }));
  }

  ngOnDestroy(): void {
    this.task.stopStatusPoller();
    this._subscriptions.unsubscribe();
  }

  train() {
    this.stepper.reset();
    this.taskFinishedSuccessfully = false;
    this.params.trainParams.pretrainedModel = this.selectedModelMeta;  // is null if no pretrained model shall be used
    this.task.putTask(this.params);
  }

  cancel() {
    this.task.cancelTask().then(
      () => {},
      () => {},
    );
    this.modelSelection.refresh();
  }

}
