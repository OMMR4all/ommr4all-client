import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {TaskWorker} from '../../../editor/task';
import {BookCommunication} from '../../../data-types/communication';
import {HttpClient} from '@angular/common/http';
import {ModelMeta} from '../../../data-types/models';
import {AlgorithmRequest} from '../algorithm-predictor-params';

@Component({
  selector: 'app-book-step-symbols-view',
  templateUrl: './book-step-symbols-view.component.html',
  styleUrls: ['./book-step-symbols-view.component.scss']
})
export class BookStepSymbolsViewComponent implements OnInit, OnDestroy {
  readonly requestBody = new AlgorithmRequest();

  @Input() operation = 'symbols';
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
