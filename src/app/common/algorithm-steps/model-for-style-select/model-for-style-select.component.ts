import { Component, EventEmitter, Input, LOCALE_ID, OnInit, Output, inject } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {AvailableModels, ModelMeta} from '../../../data-types/models';
import { HttpClient } from '@angular/common/http';
import {GlobalSettingsService} from '../../../global-settings.service';
import {ServerUrls} from '../../../server-urls';
import {map} from 'rxjs/operators';

@Component({
    selector: 'app-model-for-style-select',
    templateUrl: './model-for-style-select.component.html',
    styleUrls: ['./model-for-style-select.component.scss'],
    standalone: false
})
export class ModelForStyleSelectComponent implements OnInit {
  locale = inject(LOCALE_ID);
  private http = inject(HttpClient);
  private globalSettings = inject(GlobalSettingsService);

  @Input() bookStyle: string;
  // AlgorithmTypes value of the step whose default model is configured
  @Input() algorithmType: string;
  @Input() disabled = false;
  @Input() hint = undefined;

  availableModels = new BehaviorSubject<AvailableModels>(null);
  modelList = new BehaviorSubject<{label: string, model: ModelMeta}[]>([]);
  // false when the shown model is only inherited from the fallback style
  hasOwnDefault = false;

  @Output() selectedChange = new EventEmitter();
  @Input() selected: ModelMeta = null;
  changeSelected(s: ModelMeta) {
    this.selected = s;
    this.selectedChange.emit(s);
  }

  private get url() {
    return ServerUrls.administrative('default_models/type/' + this.algorithmType + '/style/' + this.bookStyle);
  }

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.http.get<AvailableModels>(this.url).subscribe(
      r => {
        this.availableModels.next(r);
        this.hasOwnDefault = !!r.has_own_default;
        let modelList = new Array<{label: string, model: ModelMeta}>();
        if (r.default_book_style_model) {
          const style = this.globalSettings.bookStyleById(r.default_book_style_model.style);
          modelList.push({
            label: 'Default for ' + (style ? style.name : r.default_book_style_model.style),
            model: r.default_book_style_model,
          });
        }
        modelList.push(...(r.models_of_same_book_style || []).map(m => { return {label: m[0].name, model: m[1]}; }));
        modelList = modelList.filter(m => !!m && !!m.model);
        this.modelList.next(modelList);
        this.changeSelected(this.storedModel(modelList));
      },
      () => {
        // no models at all for this step/style: keep the select empty instead of failing
        this.availableModels.next(null);
        this.modelList.next([]);
        this.changeSelected(null);
      },
    );
  }

  /** The model the server currently serves as the default, if it is one of the offered ones. */
  private storedModel(modelList = this.modelList.getValue()): ModelMeta {
    const stored = this.availableModels.getValue();
    if (!stored || !stored.selected_model) { return null; }
    const found = modelList.find(m => m.model.id === stored.selected_model.id);
    return found ? found.model : null;
  }

  reset() {
    this.changeSelected(this.storedModel());
  }

  saveCall() {
    if (!this.selected) { return; }
    const stored = this.storedModel();
    if (stored && stored.id === this.selected.id) { return; }  // no changes, do not put
    return this.http.put(this.url, this.selected).pipe(
      map(r => { this.refresh(); return r; })
    );
  }

  save() {
    const call = this.saveCall();
    if (call) { call.subscribe(r => r); }
  }

}
