import {Component, OnInit, HostListener} from '@angular/core';
import {SymbolEditorService} from './symbol-editor.service';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';
import {Point} from '../geometry/geometry';
import {Symbol, SymbolType} from '../musical-symbols/symbol';

const machina: any = require('machina');

@Component({
  selector: '[app-symbol-editor]',
  templateUrl: './symbol-editor.component.html',
  styleUrls: ['./symbol-editor.component.css']
})
export class SymbolEditorComponent implements OnInit {
  private mouseToSvg: (event: MouseEvent) => Point;
  private states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {

      }
    }
  });

  constructor(private symbolEditorService: SymbolEditorService,
              private sheetOverlayService: SheetOverlayService) {
    symbolEditorService.states = this.states;
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
  }

  get currentStaff() {
    return this.sheetOverlayService.closestStaffToMouse;
  }

  ngOnInit() {
  }

  onMouseDown(event: MouseEvent) {

  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);

    if (this.currentStaff) {
      p.y = this.currentStaff.snapToStaff(p);
      this.sheetOverlayService.selectedSymbol = new Symbol(SymbolType.Note, p);
      this.currentStaff.symbolList.add(this.sheetOverlayService.selectedSymbol);
    }

  }

  onMouseMove(event: MouseEvent) {

  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    this.onMouseDown(event);
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    this.sheetOverlayService.selectedSymbol = symbol;
  }

  onSymbolMouseMove(event: MouseEvent, symbol: Symbol) {
    this.onMouseMove(event);

  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
      if (event.code === 'Delete') {
        if (this.sheetOverlayService.selectedSymbol) {
          this.currentStaff.symbolList.remove(this.sheetOverlayService.selectedSymbol);
          this.sheetOverlayService.selectedSymbol = null;
        }
      }
  }
}
