import {Component, EventEmitter, Inject, Input, LOCALE_ID, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {AvailableModels, ModelMeta} from '../../../data-types/models';
import {HttpClient} from '@angular/common/http';
import {BookCommunication} from '../../../data-types/communication';
import {DatePipe} from '@angular/common';
import {GlobalSettingsService} from '../../../global-settings.service';
import {AlgorithmTypes} from '../../../book-view/book-step/algorithm-predictor-params';

@Component({
  selector: 'app-model-for-book-selection',
  templateUrl: './model-for-book-selection.component.html',
  styleUrls: ['./model-for-book-selection.component.scss'],
})
export class ModelForBookSelectionComponent implements OnInit, OnChanges {
  private datePipe = new DatePipe(this.locale);
  @Input() showSelected = false;
  @Input() showDefaultForNotation = true;
  @Input() showNewest = true;
  @Input() showOtherOfSameNotation = true;
  @Input() showAllDefault = true;
  @Input() book: BookCommunication;
  @Input() operation: AlgorithmTypes;
  @Input() disabled = false;
  @Input() hint = undefined;

  availableModels = new BehaviorSubject<AvailableModels>(null);
  modelList = new BehaviorSubject<Array<{ label: string, model: ModelMeta }>>([]);

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
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.operation) {
      this.refresh();
    }
  }

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.http.get<AvailableModels>(this.book.operationUrl(this.operation, 'models')).subscribe(
      r => {
        this.availableModels.next(r);
        let modelList = new Array<{label: string, model: ModelMeta}>();
        let bookModels = r.book_models.filter(b => true);
        if (this.showSelected && r.selected_model) {
          modelList.push({label: 'Selected model', model: r.selected_model});
          bookModels = bookModels.filter(m => m.id === r.selected_model.id);
        }
        if (this.showDefaultForNotation && r.default_book_style_model) {
          modelList.push({label: 'Default for ' + this.globalSettings.bookStyleById(r.book_meta.notationStyle).name, model: r.default_book_style_model});
          bookModels = bookModels.filter(m => m.id === r.default_book_style_model.id);
        }
        if (this.showNewest && r.newest_model) {
          modelList.push({label: 'Newest model', model: r.newest_model});
          bookModels = bookModels.filter(m => m.id === r.newest_model.id);
        }
        modelList.push(
          ...bookModels.map(m => ({label: this.datePipe.transform(m.created, 'medium'), model: m}))
        );
        if (this.showOtherOfSameNotation) {
          modelList.push(...r.models_of_same_book_style.map(m => ({label: m[0].name, model: m[1]})));
        }
        if (this.showAllDefault) {
          modelList.push(...r.default_models.filter(m => m.style !== r.book_meta.notationStyle && m.style === m.model.style).map(
            m => ({label: m.style, model: m.model})
          ));
        }
        modelList = modelList.filter(m => !!m && !!m.model);
        const selected = modelList.find(m => m.model.id === r.selected_model.id);
        this.changeSelected(selected ? selected.model : null);
        this.modelList.next(modelList);
      }
    );
  }
}
