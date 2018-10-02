import {Component, HostListener, OnInit} from '@angular/core';
import {SymbolEditorService} from './symbol-editor.service';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';
import {Point} from '../geometry/geometry';
import {ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {Note, Symbol} from '../data-types/page/music-region/symbol';
import {GraphicalConnectionType, SymbolType} from '../data-types/page/definitions';

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
        mouseOnSymbol: 'drag',
        mouseOnBackground: 'prepareInsert',
      },
      prepareInsert: {
        finished: 'selected',
        cancel: 'idle',
        mouseOnSymbol: 'drag',
        _onExit: () => {
          this.clickPos = null;
        }
      },
      drag: {
        finished: () => {
          this.sheetOverlayService.selectedSymbol.coord = this.draggedNote.coord;
          this.states.transition('selected');
        },
        cancel: 'idle',
        _onExit: () => {
          if (this.draggedNote) {
            this.draggedNote.detach();
            this.draggedNote = null;
          }
        },
      },
      selected: {
        mouseOnSymbol: 'drag',
        mouseOnBackground: 'prepareInsert',
      }
    }
  });
  public draggedNote: Symbol = null;
  private clickPos: Point;

  constructor(public symbolEditorService: SymbolEditorService,
              public sheetOverlayService: SheetOverlayService,
              private toolBarStateService: ToolBarStateService) {
    symbolEditorService.states = this.states;
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
  }

  get currentStaff() {
    return this.sheetOverlayService.closestStaffToMouse;
  }

  ngOnInit() {
  }

  onMouseDown(event: MouseEvent) {
    this.clickPos = new Point(event.clientX, event.clientY);
    this.states.handle('mouseOnBackground');
  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);

    if (this.states.state === 'prepareInsert') {
      if (this.clickPos && this.clickPos.measure(new Point(event.clientX, event.clientY)).lengthSqr() < 100) {
        if (this.currentStaff) {
          p.y = this.currentStaff.snapToStaff(p);
          let previousConnected = false;
          if (event.shiftKey && this.toolBarStateService.currentEditorSymbol === SymbolType.Note) {
            const closest = this.currentStaff.symbolList.closestToX(p.x, SymbolType.Note, true);
            if (closest) {
              previousConnected = closest.graphicalConnected;
              closest.graphicalConnected = true;
            }
          }
          this.sheetOverlayService.selectedSymbol = Symbol.fromType(SymbolType.Note);
          this.sheetOverlayService.selectedSymbol.attach(this.currentStaff);
          this.sheetOverlayService.selectedSymbol.coord = p;
          if (this.sheetOverlayService.selectedSymbol.symbol === SymbolType.Note) {
            (this.sheetOverlayService.selectedSymbol as Note).graphicalConnection = previousConnected ? GraphicalConnectionType.Connected : GraphicalConnectionType.None;
          }
        }
        this.states.handle('finished');
      } else {
        this.states.handle('cancel');
      }
    } else if (this.states.state === 'drag') {
      this.states.handle('finished');
    }

    event.stopPropagation();
  }

  onMouseMove(event: MouseEvent) {
    if (this.states.state === 'drag') {
      if (this.sheetOverlayService.selectedSymbol) {
        const p = this.mouseToSvg(event);
        p.y = this.currentStaff.snapToStaff(p);
        this.draggedNote.coord = p;
      }
    }

  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (this.states.state === 'idle' || this.states.state === 'selected') {
      this.sheetOverlayService.selectedSymbol = symbol;
      this.draggedNote = symbol.clone(null);
      this.states.handle('mouseOnSymbol');
    }
    event.stopPropagation();
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    this.onMouseUp(event);
    event.stopPropagation();
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
      if (event.code === 'Escape') {
        this.states.handle('cancel');
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        const p = this.sheetOverlayService.selectedSymbol.coord;
        p.x += 1;
        p.y = this.sheetOverlayService.selectedSymbol.staff.snapToStaff(p);
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        const p = this.sheetOverlayService.selectedSymbol.coord;
        p.x -= 1;
        p.y = this.sheetOverlayService.selectedSymbol.staff.snapToStaff(p);
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        const p = this.sheetOverlayService.selectedSymbol.coord;
        p.y = this.sheetOverlayService.selectedSymbol.staff.snapToStaff(p, +1);
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        const p = this.sheetOverlayService.selectedSymbol.coord;
        p.y = this.sheetOverlayService.selectedSymbol.staff.snapToStaff(p, -1);
      } else if (event.code === 'KeyS') {
        if (this.sheetOverlayService.selectedSymbol.symbol === SymbolType.Note) {
          const n = this.sheetOverlayService.selectedSymbol as Note;
          if (n.graphicalConnection !== GraphicalConnectionType.Connected) {
            n.graphicalConnection = GraphicalConnectionType.Connected;
          } else {
            n.graphicalConnection = GraphicalConnectionType.None;
          }
        }
      }
    }
  }
}
