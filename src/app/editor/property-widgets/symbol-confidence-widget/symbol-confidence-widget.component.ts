import {Component, Input, OnInit} from '@angular/core';
import {MusicSymbol, Note} from '../../../data-types/page/music-region/symbol';
import {SymbolErrorType} from "../../../data-types/page/definitions";

@Component({
  selector: 'app-symbol-confidence-widget',
  templateUrl: './symbol-confidence-widget.component.html',
  styleUrls: ['./symbol-confidence-widget.component.scss']
})
export class SymbolConfidenceWidgetComponent implements OnInit {

  @Input() selectedSymbol: MusicSymbol = null;
  constructor() { }
  get symbol() {
    return this.selectedSymbol;
  }
  round(value) {
    if (!value) {
      return null;
    }
    return Math.round(value * 1000) / 1000;
  }

  get errorType() {
    return SymbolErrorType[this.symbol.symbolConfidence.symbolErrorType];
  }
  ngOnInit() {
  }

}
