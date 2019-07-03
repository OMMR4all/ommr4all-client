import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BookCommunication} from '../../../data-types/communication';
import {TaskWorker} from '../../../editor/task';
import {HttpClient} from '@angular/common/http';
import {ModelMeta} from '../../../data-types/models';
import {AlgorithmRequest} from '../algorithm-predictor-params';

@Component({
  selector: 'app-book-step-stafflines-view',
  templateUrl: './book-step-stafflines-view.component.html',
  styleUrls: ['./book-step-stafflines-view.component.scss']
})
export class BookStepStafflinesViewComponent implements OnInit, OnDestroy {
  readonly requestBody = new AlgorithmRequest();

  @Input() operation = 'stafflines';
  @Input() book: BookCommunication;
  task: TaskWorker;

  private _selectedModelMeta: ModelMeta = null;
  get selectedModelMeta() { return this._selectedModelMeta; }
  set selectedModelMeta(m: ModelMeta) {
    this._selectedModelMeta = m;
    this.requestBody.params.modelId = m.id;
  }

  constructor(
    private http: HttpClient,
  ) {
  }

  ngOnInit() {
    this.task = new TaskWorker(this.operation, this.http, this.book, this.requestBody);
    this.task.startStatusPoller(2000);
  }

  ngOnDestroy(): void {
    this.task.stopStatusPoller();
  }
}
