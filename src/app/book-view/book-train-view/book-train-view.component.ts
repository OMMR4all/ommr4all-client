import { Component, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  TrainingBooksDialogComponent,
  TrainingBooksDialogResult,
} from '../../common/algorithm-steps/training-books-selection/training-books-dialog/training-books-dialog.component';
import {TaskProgressCodes, TaskStatusCodes, TaskWorker} from '../../editor/task';
import { HttpClient } from '@angular/common/http';
import {BookCommunication} from '../../data-types/communication';
import {BookMeta} from '../../book-list.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {AvailableModels, ModelMeta} from '../../data-types/models';
import {ModelForBookSelectionComponent} from '../../common/algorithm-steps/model-for-book-selection/model-for-book-selection.component';
import {AlgorithmGroups, AlgorithmTypes, TrainParamsResponse} from '../book-step/algorithm-predictor-params';
import { MatStepper } from '@angular/material/stepper';
import {ServerUrls} from '../../server-urls';

interface TrainSettings {
  pretrainedModel: ModelMeta;
  nTrain: number;
  includeAllTrainingData: boolean;
  // additional books to take ground truth from; the trained book is always included
  books: string[];
  symbol_enable_neume_training: boolean;
  symbol_enable_additional_symbol_types: boolean;
  // null = train for the algorithm default number of epochs
  n_epoch: number;
}

@Component({
    selector: 'app-book-train-view',
    templateUrl: './book-train-view.component.html',
    styleUrls: ['./book-train-view.component.css'],
    standalone: false
})
export class BookTrainViewComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

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
  // usable pages of the books picked in the training books dialog, for the summary line
  selectedUsablePages = 0;
  useCustomPretrainedModel = false;
  usePretrainedModel = true;

  // trainer limits of the current user, null until the server answered (or on an old server)
  trainParams: TrainParamsResponse = null;
  get nEpochDefault() { return this.trainParams ? this.trainParams.n_epoch_default : null; }
  get nEpochMax() { return this.trainParams ? this.trainParams.n_epoch_max : null; }
  get nEpochIsCapped() { return this.nEpochMax !== null; }

  trainSettings: TrainSettings = {
    pretrainedModel: null,
    nTrain: 0.8,
    includeAllTrainingData: false,
    books: [],

    symbol_enable_neume_training: false,
    symbol_enable_additional_symbol_types: false,
    n_epoch: null,
  };
  params = {
    trainParams: this.trainSettings,
    // 'cpu'/'gpu'; null lets the server pick the default (GPU for training)
    worker_resource: null as string,
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
    this.http.get<TrainParamsResponse>(ServerUrls.trainParams(this.operation)).subscribe(
      r => this.trainParams = r,
      () => this.trainParams = null,   // endpoint missing (old server): hide the epoch setting
    );
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

  chooseTrainingBooks() {
    const dialogRef = this.dialog.open(TrainingBooksDialogComponent, {
      width: '900px',
      data: {
        operation: this.operation,
        currentBook: this.book.book,
        currentStyle: this.meta ? this.meta.notationStyle : null,
        books: this.trainSettings.books,
      },
    });
    dialogRef.afterClosed().subscribe((r: TrainingBooksDialogResult) => {
      if (!r) { return; }   // cancelled
      this.trainSettings.books = r.books;
      this.selectedUsablePages = r.usablePages;
      // the server only honours the book list together with this flag
      this.trainSettings.includeAllTrainingData = r.books.length > 0;
    });
  }

  train() {
    this.stepper.reset();
    this.taskFinishedSuccessfully = false;
    this.params.trainParams.pretrainedModel = this.selectedModelMeta;  // is null if no pretrained model shall be used
    this.params.trainParams.n_epoch = this.clampedNEpoch();
    this.task.putTask(this.params);
  }

  /** null = leave the algorithm default; the server applies the same limit again. */
  private clampedNEpoch(): number {
    const n = this.trainSettings.n_epoch;
    if (!this.trainParams || n === null || n === undefined || !(n >= 1)) { return null; }
    return this.nEpochMax === null ? Math.round(n) : Math.min(Math.round(n), this.nEpochMax);
  }

  cancel() {
    this.task.cancelTask().then(
      () => {},
      () => {},
    );
    this.modelSelection.refresh();
  }

}
