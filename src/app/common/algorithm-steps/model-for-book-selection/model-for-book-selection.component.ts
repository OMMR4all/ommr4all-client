import { Component, EventEmitter, Input, LOCALE_ID, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {AvailableModels, ModelMeta} from '../../../data-types/models';
import { HttpClient } from '@angular/common/http';
import {BookCommunication} from '../../../data-types/communication';
import {DatePipe} from '@angular/common';
import {GlobalSettingsService} from '../../../global-settings.service';
import {AlgorithmTypes} from '../../../book-view/book-step/algorithm-predictor-params';

const GROUP_RECOMMENDED = $localize`:@@modelGroupRecommended:Recommended`;
const GROUP_THIS_BOOK = $localize`:@@modelGroupThisBook:Models of this book`;
const GROUP_SAME_STYLE = $localize`:@@modelGroupSameStyle:Books of the same notation style`;
const GROUP_OTHER_STYLES = $localize`:@@modelGroupOtherStyles:Other notation styles`;
const GROUP_ORDER = [GROUP_RECOMMENDED, GROUP_THIS_BOOK, GROUP_SAME_STYLE, GROUP_OTHER_STYLES];

export interface ModelOption {
  label: string;
  model: ModelMeta;
  group: string;
}

export interface ModelGroup {
  label: string;
  options: ModelOption[];
}

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
  @Input() showOtherNotations = true;
  @Input() showAllDefault = true;
  @Input() book: BookCommunication;
  @Input() operation: AlgorithmTypes;
  @Input() disabled = false;
  @Input() hint = undefined;

  availableModels = new BehaviorSubject<AvailableModels>(null);
  modelList = new BehaviorSubject<ModelOption[]>([]);
  // the same options as modelList, split into the groups the select renders
  modelGroups = new BehaviorSubject<ModelGroup[]>([]);

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
        const finalModelList: ModelOption[] = [];
        const seenIds = new Set<string>();
        const addModel = (label: string, model: ModelMeta | null, group: string) => {
          if (model && model.id && !seenIds.has(model.id)) {
            finalModelList.push({label, model, group});
            seenIds.add(model.id);
          }
        };
        const ownStyle = r.book_meta ? r.book_meta.notationStyle : null;
        const styleName = (id: string) => this.globalSettings.bookStyleById(id)?.name || id;

        if (this.showSelected) {
          addModel('Selected model', r.selected_model, GROUP_RECOMMENDED);
        }
        if (this.showDefaultForNotation && r.default_book_style_model) {
          addModel('Default for ' + styleName(ownStyle), r.default_book_style_model, GROUP_RECOMMENDED);
        }
        if (this.showNewest) {
          addModel('Newest model', r.newest_model, GROUP_RECOMMENDED);
        }
        r.book_models.forEach(m => {
          const dateStr = this.datePipe.transform(m.created, 'medium') || 'Unknown Date';
          addModel(dateStr, m, GROUP_THIS_BOOK);
        });

        if (this.showOtherOfSameNotation && r.models_of_same_book_style) {
          r.models_of_same_book_style.forEach(m => addModel(m[0].name, m[1], GROUP_SAME_STYLE));
        }
        if (this.showOtherNotations && r.models_of_other_book_styles) {
          // the style is part of the label here: unlike the group above, these entries
          // do not all share the book's notation style
          r.models_of_other_book_styles.forEach(
            m => addModel(m[0].name + ' (' + styleName(m[0].notationStyle) + ')', m[1], GROUP_OTHER_STYLES));
        }
        if (this.showAllDefault && r.default_models) {
          r.default_models
            .filter(m => m.style !== ownStyle && m.style === m.model.style)
            .forEach(m => addModel('Default for ' + styleName(m.style), m.model, GROUP_OTHER_STYLES));
        }

        this.modelList.next(finalModelList);
        this.modelGroups.next(
          GROUP_ORDER
            .map(label => ({label, options: finalModelList.filter(o => o.group === label)}))
            .filter(g => g.options.length > 0));
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
