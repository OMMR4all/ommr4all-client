import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BookCommunication} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import {TaskWorker} from '../../../editor/task';
import {AlgorithmGroups, algorithmGroupTypesMapping, AlgorithmRequest, AlgorithmTypes} from '../algorithm-predictor-params';
import {HttpClient} from '@angular/common/http';
import {ModelMeta} from '../../../data-types/models';

@Component({
  selector: 'app-book-step-view',
  templateUrl: './book-step-view.component.html',
  styleUrls: ['./book-step-view.component.scss']
})
export class BookStepViewComponent implements OnInit, OnDestroy {
  readonly AT = AlgorithmTypes;

  @Input() algorithmGroup: AlgorithmGroups;
  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;
  task: TaskWorker;

  requestBody = new AlgorithmRequest();
  private _algorithmType: AlgorithmTypes;
  set algorithmType(t: AlgorithmTypes) {
    if (t !== this._algorithmType) {
      this._algorithmType = t;
      this.requestBody.params = this.bookMeta.getAlgorithmParams(this.algorithmType);
      if (this.task) { this.task.stopStatusPoller(); }
      this.task = new TaskWorker(this.algorithmType, this.http, this.book, this.requestBody);
      this.task.startStatusPoller(2000);
    }
  }
  get algorithmType() { return this._algorithmType; }

  get showModel() { const at = this.algorithmType; return at === AlgorithmTypes.SymbolsPC || at === AlgorithmTypes.StaffLinesPC; }

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
    this.algorithmType = algorithmGroupTypesMapping.get(this.algorithmGroup)[0];
  }

  ngOnDestroy(): void {
    this.task.stopStatusPoller();
  }

  saveMeta() {
    this.book.saveMeta(this.http, this.bookMeta).subscribe(r => r);
  }
}
