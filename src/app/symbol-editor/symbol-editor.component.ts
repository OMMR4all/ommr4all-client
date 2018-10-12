import {Component, HostListener, OnInit} from '@angular/core';
import {SymbolEditorService} from './symbol-editor.service';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';
import {Point} from '../geometry/geometry';
import {ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {Note, Symbol, Clef} from '../data-types/page/music-region/symbol';
import {GraphicalConnectionType, SymbolType} from '../data-types/page/definitions';
import {MusicLine} from '../data-types/page/music-region/music-line';
import {EditorTool} from '../sheet-overlay/editor-tools/editor-tool';

const machina: any = require('machina');

@Component({
  selector: '[app-symbol-editor]',  // tslint:disable-line component-selector
  templateUrl: './symbol-editor.component.html',
  styleUrls: ['./symbol-editor.component.css']
})
export class SymbolEditorComponent extends EditorTool implements OnInit {
  public draggedNote: Symbol = null;
  private clickPos: Point;

  constructor(public symbolEditorService: SymbolEditorService,
              protected sheetOverlayService: SheetOverlayService,
              private toolBarStateService: ToolBarStateService) {
    super(sheetOverlayService);
    this._states = new machina.Fsm({
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
    symbolEditorService.states = this._states;
  }

  get currentStaff(): MusicLine {
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
          // p.y = this.currentStaff.snapToStaff(p);
          let previousConnected = GraphicalConnectionType.None;
          if (event.shiftKey && this.toolBarStateService.currentEditorSymbol === SymbolType.Note) {
            const closest = this.currentStaff.closestSymbolToX(p.x, SymbolType.Note, true) as Note;
            if (closest) {
              previousConnected = closest.graphicalConnection;
              closest.graphicalConnection = GraphicalConnectionType.Connected;
            }
          }
          const s = Symbol.fromType(this.toolBarStateService.currentEditorSymbol);
          this.sheetOverlayService.selectedSymbol = s;
          s.attach(this.currentStaff);
          s.coord = p;
          if (s.symbol === SymbolType.Note) {
            const n = s as Note;
            n.graphicalConnection = previousConnected;
            n.type = this.toolBarStateService.currentNoteType;
          } else if (s.symbol === SymbolType.Clef) {
            const c = s as Clef;
            c.type = this.toolBarStateService.currentClefType;
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
        this.draggedNote.coord = this.mouseToSvg(event);
        this.draggedNote.updateSnappedCoord(this.currentStaff);
      }
    }

  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (this.states.state === 'idle' || this.states.state === 'selected') {
      this.sheetOverlayService.selectedSymbol = symbol;
      this.draggedNote = symbol.clone(null);
      this.draggedNote.updateSnappedCoord(this.currentStaff);
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
        this.sheetOverlayService.selectedSymbol.detach();
        this.sheetOverlayService.selectedSymbol = null;
      }
    }
    if (this.sheetOverlayService.selectedSymbol) {
      const p = this.sheetOverlayService.selectedSymbol.coord;
      if (event.code === 'Escape') {
        this.states.handle('cancel');
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        p.x += 1;
        // p.y = this.sheetOverlayService.selectedSymbol.staff.snapToStaff(p);
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        p.x -= 1;
        // p.y = this.sheetOverlayService.selectedSymbol.staff.snapToStaff(p);
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        p.y -= 1;
        // p.y = this.sheetOverlayService.selectedSymbol.staff.snapToStaff(p, +1);
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        p.y += 1;
        // p.y = this.sheetOverlayService.selectedSymbol.staff.snapToStaff(p, -1);
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
