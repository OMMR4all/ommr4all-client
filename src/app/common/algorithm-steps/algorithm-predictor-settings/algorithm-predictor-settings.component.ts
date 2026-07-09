import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import {
  AlgorithmGroups,
  algorithmGroupTypesMapping,
  AlgorithmPredictorParams,
  AlgorithmTypes
} from '../../../book-view/book-step/algorithm-predictor-params';
import {BookCommunication} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import {ModelMeta} from '../../../data-types/models';
import { HttpClient } from '@angular/common/http';
import {ServerUrls} from '../../../server-urls';

@Component({
    selector: 'app-algorithm-predictor-settings',
    templateUrl: './algorithm-predictor-settings.component.html',
    styleUrls: ['./algorithm-predictor-settings.component.scss'],
    standalone: false
})
export class AlgorithmPredictorSettingsComponent implements OnInit {
  private http = inject(HttpClient);

  readonly AT = AlgorithmTypes;
  readonly AG = AlgorithmGroups;

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

  get hasAdvancedSettings() {
    return this.algorithmGroup === AlgorithmGroups.Layout || this.algorithmGroup === AlgorithmGroups.Text;
  }

  get showModel() { const at = this.algorithmType;
    if (at === AlgorithmTypes.TextLLM) { return false; }  // LLM transcription uses no trained model
    return at === AlgorithmTypes.SymbolsPC || at === AlgorithmTypes.StaffLinesPC
    || at === AlgorithmTypes.TextCalamari || at === AlgorithmTypes.TextNautilus || at === AlgorithmTypes.SymbolsSQ2SQNautilus ||
    at === AlgorithmTypes.SymbolsPCTorch || at === AlgorithmTypes.TextGuppy || AlgorithmTypes.StaffLinePCTorch; }

  private _selectedModelMeta: ModelMeta = null;
  get selectedModelMeta() { return this._selectedModelMeta; }
  set selectedModelMeta(m: ModelMeta | null) {
    this._selectedModelMeta = m;
    if (m && this.params) {
      this.params.modelId = m.id;
      this.change();
    } else if (!m && this.params) {
      this.params.modelId = '';
      this.change();
    }
  }

  // which llm providers are configured on the server (packages installed / api keys set);
  // fetched from the server, defaults to chandra only until the response arrives
  llmProviders: {[provider: string]: boolean} = {chandra: true};
  llmProviderAvailable(provider: string) { return this.llmProviders[provider] === true; }

  change() {
    this.paramsChange.emit(this.params);
    if (this.autoSave) {
      this.saveMeta();
    }
  }

  ngOnInit() {
    this.algorithmType = algorithmGroupTypesMapping.get(this.algorithmGroup)[0];
    if (this.algorithmGroup === AlgorithmGroups.Text) {
      this.http.get<{providers: {[provider: string]: boolean}}>(ServerUrls.llmProviders()).subscribe(
        r => this.llmProviders = r.providers,
        () => {},  // keep the defaults if the endpoint is not reachable
      );
    }
  }

  saveMeta() {
    this.book.saveMeta(this.http, this.bookMeta).subscribe(r => r);
  }
}
