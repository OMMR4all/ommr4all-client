import {Component, OnInit} from '@angular/core';
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
  private getSvgPoint: (x: number, y: number) => Point;
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
    this.getSvgPoint = sheetOverlayService.getSvgPoint.bind(sheetOverlayService);
  }

  get currentStaff() {
    return this.sheetOverlayService.closestStaffToMouse;
  }

  ngOnInit() {
  }

  onMouseDown(event: MouseEvent) {

  }

  onMouseUp(event: MouseEvent) {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);

    if (this.currentStaff) {
      p.y = this.currentStaff.snapToStaff(p);
      this.currentStaff.symbolList.add(new Symbol(SymbolType.Note, p));
    }

  }

  onMouseMove(event: MouseEvent) {

  }
}
