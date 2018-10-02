import {Component, OnInit, Input, EventEmitter, Output} from '@angular/core';
import {Symbol, Clef, Note} from '../data-types/page/music-region/symbol';
import {SymbolType, NoteType, ClefType} from '../data-types/page/definitions';
import {Point} from '../geometry/geometry';

@Component({
  selector: 'g[app-symbol]',
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.css']
})
export class SymbolComponent implements OnInit {
  @Input() symbol: Symbol;

  @Input() size = 0;
  @Input() connectionTo: Point = null;

  @Output() connectionMouseDown = new EventEmitter<{event: MouseEvent, symbol: Symbol}>();
  @Output() connectionMouseUp = new EventEmitter<{event: MouseEvent, symbol: Symbol}>();
  @Output() connectionMouseMove = new EventEmitter<{event: MouseEvent, symbol: Symbol}>();

  SymbolType = SymbolType;
  ClefType = ClefType;
  NoteType = NoteType;

  constructor() {
  }

  ngOnInit() {
    if (this.size === 0) {
      if (!this.symbol.staff) {
        console.error('Symbol without staff or height definition');
      }
      this.size = this.symbol.staff.avgStaffLineDistance;
    }
  }

  asNote() { return this.symbol as Note; }
  asClef() { return this.symbol as Clef; }

}
