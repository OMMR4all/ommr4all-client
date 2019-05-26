import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {TaskStatusCodes, TaskWorker} from '../../editor/task';
import {HttpClient} from '@angular/common/http';
import {BookCommunication} from '../../data-types/communication';

@Component({
  selector: 'app-book-train-view',
  templateUrl: './book-train-view.component.html',
  styleUrls: ['./book-train-view.component.css']
})
export class BookTrainViewComponent implements OnInit, OnDestroy {
  @Input() book: BookCommunication;
  @Input() operation: string;
  task: TaskWorker;

  constructor(
    private http: HttpClient,
  ) {
  }

  ngOnInit() {
    this.task = new TaskWorker(this.operation, this.http, this.book);
    this.task.startStatusPoller(2000);
  }

  ngOnDestroy(): void {
    this.task.stopStatusPoller();
  }

  train() {
    this.task.putTask({});
  }

  cancel() {
    this.task.cancelTask().then(
      () => {},
      () => {},
    );
  }

}
