import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BookCommunication} from '../../../data-types/communication';
import {AvailableModels, ModelMeta} from '../../../data-types/models';
import {BookMeta} from '../../../book-list.service';
import {ModelForBookSelectionComponent} from '../../../common/model-for-book-selection/model-for-book-selection.component';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-book-step-workflow',
  templateUrl: './book-step-workflow.component.html',
  styleUrls: ['./book-step-workflow.component.scss']
})
export class BookStepWorkflowComponent implements OnInit, OnDestroy {
  private _subscriptions = new Subscription();
  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;


  @ViewChild('stafflines', {static: true}) staffLinesSelect: ModelForBookSelectionComponent;
  @ViewChild('symbols', {static: true}) symbolsSelect: ModelForBookSelectionComponent;

  private _selectedModelMetas: Map<string, {model: ModelMeta, select: ModelForBookSelectionComponent}> = null;

  set selectedStaffLinesModelMeta(m: ModelMeta) { this._setModelMeta(m, 'stafflines'); }
  get selectedStaffLinesModelMeta(): ModelMeta { return this._getModelMeta('stafflines'); }

  set selectedSymbolsModelMeta(m: ModelMeta) { this._setModelMeta(m, 'symbols'); }
  get selectedSymbolsModelMeta(): ModelMeta { return this._getModelMeta('symbols'); }

  private _setModelMeta(m: ModelMeta, field: string) {
    if (!this._selectedModelMetas.get(field).model) {
      this._selectedModelMetas.get(field).model = m;
      return;
    }
    if (this._selectedModelMetas.get(field).model !== m) {
      this._selectedModelMetas.get(field).model = m;
      if (m) {
        this.bookMeta.defaultModels[field] = m.id;
        this.saveMeta();
      }
    }
  }

  private _getModelMeta(field: string): ModelMeta {
    const m = this.findModelInComponent(this._selectedModelMetas.get(field).select, this.bookMeta.defaultModels[field]);
    if (m) { return m; }
    return this._selectedModelMetas.get(field).model;
  }

  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {
    this._selectedModelMetas = new Map<string, {model: ModelMeta, select: ModelForBookSelectionComponent}>(
      [
        ['stafflines', {model: null, select: this.staffLinesSelect}],
        ['symbols', {model: null, select: this.symbolsSelect}],
      ],
    );

    this._selectedModelMetas.forEach((v, k) => {
      this._subscriptions.add(v.select.modelList.subscribe(
        models => { v.model = this.findModelInModels(models, this.bookMeta.defaultModels[k]); }
      ));
    });
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  private findModelInModels(models: Array<{label: string, model: ModelMeta}>, id: string) {
    if (!models) { return undefined; }
    const r = models.find(m => m.model.id === id);
    if (r) { return r.model; }
    return null;
  }

  private findModelInComponent(c: ModelForBookSelectionComponent, id: string) {
    if (!c) { return undefined; }
    return this.findModelInModels(c.modelList.getValue(), id);
  }

  private saveMeta() {
    this.http.put(this.book.meta(), this.bookMeta).subscribe(
      r => {}
    );
  }

}
