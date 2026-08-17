import { Component, EventEmitter, Input, LOCALE_ID, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {AvailableModels, ModelMeta} from '../../../data-types/models';
import { HttpClient } from '@angular/common/http';
import {GlobalSettingsService} from '../../../global-settings.service';
import {ServerUrls} from '../../../server-urls';
import {map} from 'rxjs/operators';
import {ModelGroup, ModelOption} from '../model-for-book-selection/model-for-book-selection.component';

const GROUP_CURRENT_STYLE = $localize`:@@modelGroupThisStyle:This notation style`;
const GROUP_OTHER_STYLES = $localize`:@@modelGroupOtherStyles:Other notation styles`;

@Component({
    selector: 'app-model-for-style-select',
    templateUrl: './model-for-style-select.component.html',
    styleUrls: ['./model-for-style-select.component.scss'],
    standalone: false
})
export class ModelForStyleSelectComponent implements OnInit, OnChanges {
  locale = inject(LOCALE_ID);
  private http = inject(HttpClient);
  private globalSettings = inject(GlobalSettingsService);

  @Input() bookStyle: string;
  // AlgorithmTypes value of the step whose default model is configured
  @Input() algorithmType: string;
  @Input() disabled = false;
  @Input() hint = undefined;

  availableModels = new BehaviorSubject<AvailableModels>(null);
  modelList = new BehaviorSubject<ModelOption[]>([]);
  modelGroups = new BehaviorSubject<ModelGroup[]>([]);
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

  ngOnChanges(changes: SimpleChanges): void {
    // the table switches the style of all selects at once, they must reload for the new style
    if ((changes.bookStyle && !changes.bookStyle.firstChange)
      || (changes.algorithmType && !changes.algorithmType.firstChange)) {
      this.selected = null;
      this.availableModels.next(null);
      this.refresh();
    }
  }

  /** Whether the user picked a different model than the one the server currently serves. */
  get isDirty(): boolean {
    const stored = this.storedModel();
    if (!this.selected) { return false; }
    return !stored || stored.id !== this.selected.id;
  }

  refresh() {
    this.http.get<AvailableModels>(this.url).subscribe(
      r => {
        this.availableModels.next(r);
        this.hasOwnDefault = !!r.has_own_default;
        const styleName = (id: string) => this.globalSettings.bookStyleById(id)?.name || id;
        let modelList = new Array<ModelOption>();
        if (r.default_book_style_model) {
          modelList.push({
            label: 'Default for ' + styleName(r.default_book_style_model.style),
            model: r.default_book_style_model,
            group: GROUP_CURRENT_STYLE,
          });
        }
        modelList.push(...(r.models_of_same_book_style || [])
          .map(m => ({label: m[0].name, model: m[1], group: GROUP_CURRENT_STYLE})));
        // books of other styles: a style without a trained book of its own would
        // otherwise have nothing to pick from
        modelList.push(...(r.models_of_other_book_styles || [])
          .map(m => ({label: m[0].name + ' (' + styleName(m[0].notationStyle) + ')',
                      model: m[1], group: GROUP_OTHER_STYLES})));
        modelList = modelList.filter(m => !!m && !!m.model);
        this.modelList.next(modelList);
        this.modelGroups.next(
          [GROUP_CURRENT_STYLE, GROUP_OTHER_STYLES]
            .map(label => ({label, options: modelList.filter(o => o.group === label)}))
            .filter(g => g.options.length > 0));
        this.changeSelected(this.storedModel(modelList));
      },
      () => {
        // no models at all for this step/style: keep the select empty instead of failing
        this.availableModels.next(null);
        this.modelList.next([]);
        this.modelGroups.next([]);
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
