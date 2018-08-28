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
        select: 'select'
      },
      select: {
        idle: 'idle'
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

    if (this.states.state === 'idle') {
      if (this.currentStaff) {
        p.y = this.currentStaff.snapToStaff(p);
        this.sheetOverlayService.selectedSymbol = new Symbol(SymbolType.Note, p);
        this.currentStaff.symbolList.add(this.sheetOverlayService.selectedSymbol);
      }
    } else if (this.states.state === 'select') {
      this.states.handle('idle');
    }

  }

  onMouseMove(event: MouseEvent) {
    if (this.states.state === 'select') {
      if (this.sheetOverlayService.selectedSymbol) {
        const p = this.mouseToSvg(event);
        p.y = this.currentStaff.snapToStaff(p);
        this.sheetOverlayService.selectedSymbol.position = p;
      }
    }

  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (this.states.state === 'idle') {
      this.sheetOverlayService.selectedSymbol = symbol;
      this.states.handle('select');
    }
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    this.onMouseUp(event);
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
    if (this.sheetOverlayService.selectedSymbol) {
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        this.sheetOverlayService.selectedSymbol.position.x += 1;
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        this.sheetOverlayService.selectedSymbol.position.x -= 1;
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        const p = this.sheetOverlayService.selectedSymbol.position;
        p.y = this.currentStaff.snapToStaff(p, +1);
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        const p = this.sheetOverlayService.selectedSymbol.position;
        p.y = this.currentStaff.snapToStaff(p, -1);
      }
    }
  }
}
