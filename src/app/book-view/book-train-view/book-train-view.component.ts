import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {TaskProgressCodes, TaskStatusCodes, TaskWorker} from '../../editor/task';
import {HttpClient} from '@angular/common/http';
import {BookCommunication} from '../../data-types/communication';
import {BookMeta, BookNotationStyle} from '../../book-list.service';
import {Subscription} from 'rxjs';

interface TrainSettings {
  pretrainedModel: string;
}

@Component({
  selector: 'app-book-train-view',
  templateUrl: './book-train-view.component.html',
  styleUrls: ['./book-train-view.component.css']
})
export class BookTrainViewComponent implements OnInit, OnDestroy {
  private static readonly toIndex = [TaskProgressCodes.INITIALIZING, TaskProgressCodes.RESOLVING_DATA, TaskProgressCodes.LOADING_DATA, TaskProgressCodes.PREPARING_TRAINING, TaskProgressCodes.WORKING, TaskProgressCodes.FINALIZING];

  private readonly _subscriptions = new Subscription();
  readonly NotationStyle = BookNotationStyle;
  readonly TaskProgressCodes = TaskProgressCodes;
  @Input() book: BookCommunication;
  @Input() meta: BookMeta;
  @Input() operation: string;
  task: TaskWorker;

  taskFinishedSuccessfully = false;


  get selectedStepperIndex() {
    return BookTrainViewComponent.toIndex.indexOf(this.task.status ? this.task.status.progress_code : 0);
  }

  isCompleted(code: TaskProgressCodes) {
    return this.selectedStepperIndex > BookTrainViewComponent.toIndex.indexOf(code);
  }

  useCustomPretrainedModel = false;

  constructor(
    private http: HttpClient,
  ) {
  }

  ngOnInit() {
    this.task = new TaskWorker(this.operation, this.http, this.book);
    this.task.startStatusPoller(2000);
    this._subscriptions.add(this.task.taskFinished.subscribe(r => {
      if (!r) {
        this.task.cancelTask();
      } else {
        this.taskFinishedSuccessfully = true;
      }
    }));
  }

  ngOnDestroy(): void {
    this.task.stopStatusPoller();
    this._subscriptions.unsubscribe();
  }

  train() {
    this.taskFinishedSuccessfully = false;
    this.task.putTask({});
  }

  cancel() {
    this.task.cancelTask().then(
      () => {},
      () => {},
    );
  }

}
