import { Component, EventEmitter, Input, LOCALE_ID, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {AvailableModels, ModelMeta} from '../../../data-types/models';
import { HttpClient } from '@angular/common/http';
import {BookCommunication} from '../../../data-types/communication';
import {DatePipe} from '@angular/common';
import {GlobalSettingsService} from '../../../global-settings.service';
import {AlgorithmTypes} from '../../../book-view/book-step/algorithm-predictor-params';

@Component({
    selector: 'app-model-for-book-selection',
    templateUrl: './model-for-book-selection.component.html',
    styleUrls: ['./model-for-book-selection.component.scss'],
    standalone: false
})
export class ModelForBookSelectionComponent implements OnInit, OnChanges {
  locale = inject(LOCALE_ID);
  private http = inject(HttpClient);
  private globalSettings = inject(GlobalSettingsService);

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
  modelList = new BehaviorSubject<{ label: string, model: ModelMeta }[]>([]);

  @Output() selectedChange = new EventEmitter();
  @Input() selected: ModelMeta = null;

  changeSelected(s: ModelMeta) {
    this.selected = s;
    this.selectedChange.emit(s);
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
        const finalModelList: {label: string, model: ModelMeta}[] = [];
        const seenIds = new Set<string>();
        const addModel = (label: string, model: ModelMeta | null) => {
          if (model && model.id && !seenIds.has(model.id)) {
            finalModelList.push({label, model});
            seenIds.add(model.id);
          }
        };
        if (this.showSelected) {
          addModel('Selected model', r.selected_model);
        }
        if (this.showDefaultForNotation && r.default_book_style_model) {
          const style = this.globalSettings.bookStyleById(r.book_meta.notationStyle);
          addModel('Default for ' + (style?.name || 'Style'), r.default_book_style_model);
        }
        if (this.showNewest) {
          addModel('Newest model', r.newest_model);
        }
        r.book_models.forEach(m => {
          const dateStr = this.datePipe.transform(m.created, 'medium') || 'Unknown Date';
          addModel(dateStr, m);
        });

        if (this.showOtherOfSameNotation && r.models_of_same_book_style) {
          r.models_of_same_book_style.forEach(m => addModel(m[0].name, m[1]));
        }
        if (this.showAllDefault && r.default_models) {
          r.default_models
            .filter(m => m.style !== r.book_meta.notationStyle && m.style === m.model.style)
            .forEach(m => addModel(m.style, m.model));
        }

        this.modelList.next(finalModelList);
        // an explicitly passed selection (e.g. a stored per-step modelId) wins
        // over the server's default selection
        const targetId = this.selected?.id || r.selected_model?.id;
        const matched = finalModelList.find(m => m.model.id === targetId);

        if (matched) {
          this.changeSelected(matched.model);
        } else if (finalModelList.length > 0) {
          this.changeSelected(finalModelList[0].model);
        } else {
          this.changeSelected(null);
        }
      }
    );
  }
}
