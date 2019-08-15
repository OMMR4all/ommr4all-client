import {Component, EventEmitter, Inject, Input, LOCALE_ID, OnInit, Output} from '@angular/core';
import {BookCommunication} from '../../../data-types/communication';
import {BehaviorSubject} from 'rxjs';
import {AvailableModels, ModelMeta} from '../../../data-types/models';
import {HttpClient} from '@angular/common/http';
import {GlobalSettingsService} from '../../../global-settings.service';
import {ServerUrls} from '../../../server-urls';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-model-for-style-select',
  templateUrl: './model-for-style-select.component.html',
  styleUrls: ['./model-for-style-select.component.scss']
})
export class ModelForStyleSelectComponent implements OnInit {
  @Input() bookStyle: string;
  @Input() group: string;
  @Input() disabled = false;
  @Input() hint = undefined;

  availableModels = new BehaviorSubject<AvailableModels>(null);
  modelList = new BehaviorSubject<Array<{label: string, model: ModelMeta}>>([]);

  @Output() selectedChange = new EventEmitter();
  @Input() selected: ModelMeta = null;
  changeSelected(s: ModelMeta) {
    this.selected = s;
    this.selectedChange.emit(s);
  }

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private http: HttpClient,
    private globalSettings: GlobalSettingsService,
  ) { }

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.http.get<AvailableModels>(ServerUrls.administrative('default_models/group/' + this.group + '/style/' + this.bookStyle)).subscribe(
      r => {
        this.availableModels.next(r);
        let modelList = new Array<{label: string, model: ModelMeta}>();
        if (r.default_book_style_model) {
          modelList.push({label: 'Default for ' + this.globalSettings.bookStyleById(r.default_book_style_model.style).name, model: r.default_book_style_model});
        }
        modelList.push(...r.models_of_same_book_style.map(m => { return {label: m[0].name, model: m[1]}; }));
        modelList = modelList.filter(m => !!m);
        const selected = modelList.find(m => m.model.id === r.selected_model.id);
        this.changeSelected(selected ? selected.model : null);
        this.modelList.next(modelList);
      }
    );
  }

  reset() {
    const selected = this.modelList.getValue().find(m => m.model.id === this.availableModels.getValue().selected_model.id);
    this.changeSelected(selected ? selected.model : null);
  }

  saveCall() {
    if (!this.selected) { return; }
    const selected = this.modelList.getValue().find(m => m.model.id === this.availableModels.getValue().selected_model.id);
    if (selected.model.id === this.selected.id) { return; }  // no changes, do not put
    return this.http.put(ServerUrls.administrative('default_models/group/' + this.group + '/style/' + this.bookStyle), this.selected).pipe(
      map(r => { this.refresh(); return r; })
    );
  }

  save() {
    this.saveCall().subscribe(r => r);
  }

}
