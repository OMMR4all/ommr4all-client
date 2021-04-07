import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  AlgorithmGroups,
  algorithmGroupTypesMapping,
  AlgorithmTypes,
  metaForAlgorithmType
} from '../../../book-view/book-step/algorithm-predictor-params';
import {ModelMeta} from '../../../data-types/models';

@Component({
  selector: 'app-algorithm-type-for-group-selection',
  templateUrl: './algorithm-type-for-group-selection.component.html',
  styleUrls: ['./algorithm-type-for-group-selection.component.scss']
})
export class AlgorithmTypeForGroupSelectionComponent implements OnInit {
  @Input() group: AlgorithmGroups;
  @Input() hideIfSingleType = true;

  get types(): AlgorithmTypes[] { return algorithmGroupTypesMapping.get(this.group); }
  get hidden() { return this.hideIfSingleType && this.types.length <= 1; }

  @Output() selectedChange = new EventEmitter();
  @Input() selected: AlgorithmTypes = null;
  changeSelected(s: AlgorithmTypes) {
    this.selected = s;
    this.selectedChange.emit(s);
  }

  get currentAlgorthmMeta() { return metaForAlgorithmType.get(this.selected); }

  constructor() { }

  ngOnInit() {
  }

  labelForType(a: AlgorithmTypes) {
    const meta = metaForAlgorithmType.get(a);
    if (meta.default === true) {
      return meta.label + ' (default)';
    }
    return meta.label;
  }
}
