import {Component, OnInit, Input, EventEmitter, Output, AfterViewChecked, AfterViewInit} from '@angular/core';
import {Symbol, Clef, Note} from '../data-types/page/music-region/symbol';
import {SymbolType, NoteType, ClefType} from '../data-types/page/definitions';
import {Point} from '../geometry/geometry';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';

@Component({
  selector: 'g[app-symbol]',  // tslint:disable-line component-selector
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.css']
})
export class SymbolComponent {
  @Input() symbol: Symbol;
  @Input() set size(s) {this._size = s;}
  @Input() connectionTo: Point = null;

  @Output() connectionMouseDown = new EventEmitter<{event: MouseEvent, symbol: Symbol}>();
  @Output() connectionMouseUp = new EventEmitter<{event: MouseEvent, symbol: Symbol}>();
  @Output() connectionMouseMove = new EventEmitter<{event: MouseEvent, symbol: Symbol}>();

  SymbolType = SymbolType;
  ClefType = ClefType;
  NoteType = NoteType;

  private _size = 0;

  get size() {
    if (this._size === 0) {
      if (!this.symbol.staff) {
        console.error('Symbol without staff or height definition');
      }
      return this.symbol.staff.avgStaffLineDistance;
    }
    return this._size;
  }


  constructor(
    private sheetOverlay: SheetOverlayService
  ) {
  }

  asNote() { return this.symbol as Note; }
  asClef() { return this.symbol as Clef; }

  s(v: number) { return this.sheetOverlay.scaleIndependentSize(v); }

}
