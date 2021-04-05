import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BookCommunication} from '../../../data-types/communication';
import {ModelMeta} from '../../../data-types/models';
import {BookMeta} from '../../../book-list.service';
import {ModelForBookSelectionComponent} from '../../../common/algorithm-steps/model-for-book-selection/model-for-book-selection.component';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {AlgorithmGroups, AlgorithmPredictorParams, AlgorithmTypes} from '../algorithm-predictor-params';
import {BookPermissionFlag, BookPermissionFlags} from '../../../data-types/permissions';

@Component({
  selector: 'app-book-step-workflow',
  templateUrl: './book-step-workflow.component.html',
  styleUrls: ['./book-step-workflow.component.scss']
})
export class BookStepWorkflowComponent implements OnInit, OnDestroy {
  readonly AT = AlgorithmTypes;
  private _subscriptions = new Subscription();
  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;

  private readonly selectedAlgorithmForGroup = new Map<AlgorithmGroups, AlgorithmTypes>([
    [AlgorithmGroups.StaffLines, AlgorithmTypes.StaffLinesPC],
    [AlgorithmGroups.Symbols, AlgorithmTypes.SymbolsPC],
  ]);

  @ViewChild(AlgorithmGroups.StaffLines, {static: true}) staffLinesSelect: ModelForBookSelectionComponent;
  @ViewChild(AlgorithmGroups.Symbols, {static: true}) symbolsSelect: ModelForBookSelectionComponent;
  @ViewChild(AlgorithmGroups.Text, {static: true}) textSelect: ModelForBookSelectionComponent;

  private _selectedModelMetas: Map<AlgorithmGroups, {model: ModelMeta, select: ModelForBookSelectionComponent}> = null;

  set selectedStaffLinesModelMeta(m: ModelMeta) { this._setModelMeta(m, AlgorithmGroups.StaffLines); }
  get selectedStaffLinesModelMeta(): ModelMeta { return this._getModelMeta(AlgorithmGroups.StaffLines); }

  set selectedSymbolsModelMeta(m: ModelMeta) { this._setModelMeta(m, AlgorithmGroups.Symbols); }
  get selectedSymbolsModelMeta(): ModelMeta { return this._getModelMeta(AlgorithmGroups.Symbols); }

  set selectedTextModelMeta(m: ModelMeta) { this._setModelMeta(m, AlgorithmGroups.Text); }
  get selectedTextModelMeta(): ModelMeta { return this._getModelMeta(AlgorithmGroups.Text); }

  private _setModelMeta(m: ModelMeta, field: AlgorithmGroups) {
    if (!this._selectedModelMetas.get(field).model) {
      this._selectedModelMetas.get(field).model = m;
      return;
    }
    if (this._selectedModelMetas.get(field).model !== m) {
      this._selectedModelMetas.get(field).model = m;
      if (m) {
        this.bookMeta.getAlgorithmParams(this.selectedAlgorithmForGroup.get(field)).modelId = m.id;
        this.saveMeta();
      }
    }
  }

  private _getModelMeta(field: AlgorithmGroups): ModelMeta {
    const type = this.selectedAlgorithmForGroup.get(field);
    const m = this.findModelInComponentByParams(this._selectedModelMetas.get(field).select, this.bookMeta.getAlgorithmParams(type));
    if (m) { return m; }
    return this._selectedModelMetas.get(field).model;
  }

  get numberOfStaffLines() { return this.bookMeta.numberOfStaffLines; }
  set numberOfStaffLines(lines: number) { this.bookMeta.numberOfStaffLines = lines; this.saveMeta(); }

  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {
    this._selectedModelMetas = new Map<AlgorithmGroups, {model: ModelMeta, select: ModelForBookSelectionComponent}>(
      [
        [AlgorithmGroups.StaffLines, {model: null, select: this.staffLinesSelect}],
        [AlgorithmGroups.Symbols, {model: null, select: this.symbolsSelect}],
        [AlgorithmGroups.Text, {model: null, select: this.textSelect}],

      ],
    );

    this._selectedModelMetas.forEach((v, k) => {
      this._subscriptions.add(v.select.modelList.subscribe(
        models => { v.model = this.findModelInModelsByParams(models, this.bookMeta.getAlgorithmParams(this.selectedAlgorithmForGroup.get(k))); }
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
  private findModelInModelsByParams(models: Array<{label: string, model: ModelMeta}>, p: AlgorithmPredictorParams) {
    if (!models || !p) { return undefined; }
    return this.findModelInModels(models, p.modelId);
  }

  private findModelInComponentByParams(c: ModelForBookSelectionComponent, p: AlgorithmPredictorParams) {
    if (!c || !p) { return undefined; }
    return this.findModelInComponent(c, p.modelId);
  }
  private findModelInComponent(c: ModelForBookSelectionComponent, id: string) {
    if (!c) { return undefined; }
    return this.findModelInModels(c.modelList.getValue(), id);
  }

  private saveMeta() {
    this.book.saveMeta(this.http, this.bookMeta).subscribe(
      r => {
      }
    );
  }

}
