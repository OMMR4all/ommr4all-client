import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  AlgorithmGroups, algorithmGroupTypesMapping,
  AlgorithmPredictorParams,
  AlgorithmTypes
} from '../../../book-view/book-step/algorithm-predictor-params';
import {BookCommunication} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import {ModelMeta} from '../../../data-types/models';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-algorithm-predictor-settings',
  templateUrl: './algorithm-predictor-settings.component.html',
  styleUrls: ['./algorithm-predictor-settings.component.scss']
})
export class AlgorithmPredictorSettingsComponent implements OnInit {
  readonly AT = AlgorithmTypes;
  @Input() algorithmGroup: AlgorithmGroups;
  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;
  @Input() autoSave = true;

  @Output() typeChange = new EventEmitter<{params: AlgorithmPredictorParams, type: AlgorithmTypes}>();
  @Output() paramsChange = new EventEmitter<AlgorithmPredictorParams>();

  params: AlgorithmPredictorParams;
  private _algorithmType: AlgorithmTypes;
  set algorithmType(t: AlgorithmTypes) {
    if (t !== this._algorithmType) {
      this._algorithmType = t;
      this.params = this.bookMeta.getAlgorithmParams(this.algorithmType);
      this.typeChange.emit({params: this.params, type: this.algorithmType});
    }
  }
  get algorithmType() { return this._algorithmType; }
  get showUpload() { const at = this.algorithmType; return at === AlgorithmTypes.SymbolAlignment; }
  get showModel() { const at = this.algorithmType; return at === AlgorithmTypes.SymbolsPC ||
    at === AlgorithmTypes.StaffLinesPC || at === AlgorithmTypes.SymbolAlignment; }
  private _selectedModelMeta: ModelMeta = null;
  get selectedModelMeta() { return this._selectedModelMeta; }
  set selectedModelMeta(m: ModelMeta) {
    this._selectedModelMeta = m;
    this.params.modelId = m.id;
    this.change();
  }

  change() {
    this.paramsChange.emit(this.params);
    if (this.autoSave) {
      this.saveMeta();
    }
  }

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.algorithmType = algorithmGroupTypesMapping.get(this.algorithmGroup)[0];
  }

  saveMeta() {
    this.book.saveMeta(this.http, this.bookMeta).subscribe(r => r);
  }
}
