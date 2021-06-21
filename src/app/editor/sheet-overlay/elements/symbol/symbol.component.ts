import {Component, OnInit, Input, EventEmitter, Output, AfterViewChecked, AfterViewInit} from '@angular/core';
import {MusicSymbol, Clef, Note, Accidental} from '../../../../data-types/page/music-region/symbol';
import {SymbolType, NoteType, ClefType, AccidentalType} from '../../../../data-types/page/definitions';
import {Point} from '../../../../geometry/geometry';
import {SheetOverlayService, SymbolConnection} from '../../sheet-overlay.service';
import {NonScalingComponentType} from '../non-scaling-component/non-scaling.component';

@Component({
  selector: 'g[app-symbol]',  // tslint:disable-line component-selector
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.css']
})
export class SymbolComponent {
  @Input() symbol: MusicSymbol;
  @Input() selected: boolean;
  @Input() selectable: boolean;
  @Input() set size(s) { this._size = s; }
  @Input() connectionTo: SymbolConnection = new SymbolConnection();
  @Input() showCenterOnly: boolean;
  @Input() showConfidence: boolean;
  @Output() connectionMouseDown = new EventEmitter<{event: MouseEvent, symbol: MusicSymbol}>();
  @Output() connectionMouseUp = new EventEmitter<{event: MouseEvent, symbol: MusicSymbol}>();
  @Output() connectionMouseMove = new EventEmitter<{event: MouseEvent, symbol: MusicSymbol}>();

  SymbolType = SymbolType;
  ClefType = ClefType;
  NoteType = NoteType;
  AccidType = AccidentalType;
  NonScalingType = NonScalingComponentType;

  private _size = 0;

  get size() {
    if (this._size === 0) {
      if (!this.symbol.staff) {
        console.error('MusicSymbol without staff or height definition');
      }
      return this.symbol.staff.avgStaffLineDistance;
    }
    return this._size;
  }

  get symbolConfidence() {
    if (this.symbol.symbolConfidence.symbolSequenceConfidence) {
      const conf = this.symbol.symbolConfidence.symbolSequenceConfidence.confidence;
      if (conf < 0.02) {
        return 1;
      }

      //return this.symbol.symbolConfidence.symbolSequenceConfidence.confidence;
    }
    return 0;
  }
  constructor(
    private sheetOverlay: SheetOverlayService
  ) {
  }

  asNote() { return this.symbol as Note; }
  asClef() { return this.symbol as Clef; }
  asAccid() { return this.symbol as Accidental; }

  s(v: number) { return this.sheetOverlay.scaleIndependentSize(v); }

}
