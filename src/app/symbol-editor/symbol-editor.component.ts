import {Component, OnInit} from '@angular/core';
import {SymbolEditorService} from './symbol-editor.service';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';
import {Point} from '../geometry/geometry';
import {ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {Clef, Note, Symbol} from '../data-types/page/music-region/symbol';
import {GraphicalConnectionType, SymbolType} from '../data-types/page/definitions';
import {MusicLine} from '../data-types/page/music-region/music-line';
import {EditorTool} from '../sheet-overlay/editor-tools/editor-tool';
import {ActionsService} from '../editor/actions/actions.service';
import {copyFromList, copyList} from '../utils/copy';

const machina: any = require('machina');

@Component({
  selector: '[app-symbol-editor]',  // tslint:disable-line component-selector
  templateUrl: './symbol-editor.component.html',
  styleUrls: ['./symbol-editor.component.css']
})
export class SymbolEditorComponent extends EditorTool implements OnInit {
  public draggedNote: Symbol = null;
  private _draggedNoteInitialPosition: Point;
  private _draggedNoteInitialSnapToStaffPos: Point;
  private _draggedNoteInitialSorting: Array<Symbol>;
  private clickPos: Point;

  constructor(public symbolEditorService: SymbolEditorService,
              protected sheetOverlayService: SheetOverlayService,
              private toolBarStateService: ToolBarStateService,
              private actions: ActionsService) {
    super(sheetOverlayService);
    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
        },
        active: {
          idle: 'idle',
          mouseOnSymbol: 'drag',
          mouseOnBackground: 'prepareInsert',
          delete: () => {
            this.actions.startAction('Delete symbol');
            if (this.sheetOverlayService.selectedSymbol) {
              this.actions.detachSymbol(this.sheetOverlayService.selectedSymbol);
              this.sheetOverlayService.selectedSymbol = null;
            }
            this.actions.finishAction();
          },
        },
        prepareInsert: {
          finished: 'selected',
          cancel: 'active',
          mouseOnSymbol: 'drag',
          _onExit: () => {
            this.clickPos = null;
          }
        },
        drag: {
          delete: () => {
            this.states.handle('cancel');
            this.states.handle('delete');
          },
          finished: () => {
            this.actions.changePoint2(this.draggedNote.coord, this._draggedNoteInitialPosition);
            this.actions.changePoint2(this.draggedNote.snappedCoord, this._draggedNoteInitialSnapToStaffPos);
            this.actions.changeArray2(this.draggedNote.staff.symbols, this._draggedNoteInitialSorting);
            this.states.transition('selected');
          },
          cancel: () => {
            if (this.draggedNote && this._draggedNoteInitialPosition) {
              this.draggedNote.coord.copyFrom(this._draggedNoteInitialPosition);
              this.draggedNote.snappedCoord.copyFrom(this._draggedNoteInitialSnapToStaffPos);
              copyFromList(this.draggedNote.staff.symbols, this._draggedNoteInitialSorting);
            }
            this.states.transition('active');
          },
          _onEnter: () => {
            this.actions.startAction('Drag symbol');
            this._draggedNoteInitialPosition = this.draggedNote.coord.copy();
            this._draggedNoteInitialSnapToStaffPos = this.draggedNote.snappedCoord.copy();
            this._draggedNoteInitialSorting = copyList(this.draggedNote.staff.symbols);
          },
          _onExit: () => {
            this.actions.finishAction();
            this.draggedNote = null;
            this._draggedNoteInitialSnapToStaffPos = null;
            this._draggedNoteInitialSorting = null;
            this._draggedNoteInitialPosition = null;
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
          this.actions.startAction('Insert symbol');
          let previousConnected = GraphicalConnectionType.Gaped;
          if (event.shiftKey && this.toolBarStateService.currentEditorSymbol === SymbolType.Note) {
            const closest = this.currentStaff.closestSymbolToX(p.x, SymbolType.Note, true) as Note;
            if (closest) {
              previousConnected = closest.graphicalConnection;
              this.actions.changeGraphicalConnection(closest, GraphicalConnectionType.Looped);
            }
          }
          const s = Symbol.fromType(this.toolBarStateService.currentEditorSymbol);
          this.sheetOverlayService.selectedSymbol = s;
          s.coord = p;
          if (s.symbol === SymbolType.Note) {
            const n = s as Note;
            n.graphicalConnection = previousConnected;
            n.type = this.toolBarStateService.currentNoteType;
          } else if (s.symbol === SymbolType.Clef) {
            const c = s as Clef;
            c.type = this.toolBarStateService.currentClefType;
          }
          this.actions.attachSymbol(this.currentStaff, s);
          this.actions.sortSymbolIntoStaff(s);
          this.actions.finishAction();
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
        this.draggedNote.snappedCoord = this.draggedNote.computeSnappedCoord();
        this.draggedNote.staff.sortSymbol(this.draggedNote);
      }
    }

  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (this.states.state === 'active' || this.states.state === 'selected') {
      this.sheetOverlayService.selectedSymbol = symbol;
      this.draggedNote = symbol;
      this.draggedNote.snappedCoord = this.draggedNote.computeSnappedCoord();
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

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Delete') {
      this.states.handle('delete');
    }
    if (this.sheetOverlayService.selectedSymbol) {
      const p = this.sheetOverlayService.selectedSymbol.coord;
      const s = this.sheetOverlayService.selectedSymbol;
      if (event.code === 'Escape') {
        this.states.handle('cancel');
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        this.actions.startAction('Move symbol');
        this.actions.changePoint(p, p, p.add(new Point(1, 0)));
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        this.actions.startAction('Move symbol');
        this.actions.changePoint(p, p, p.add(new Point(-1, 0)));
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        this.actions.startAction('Move symbol');
        this.actions.changePoint(p, p, p.add(new Point(0, -1)));
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        this.actions.startAction('Move symbol');
        this.actions.changePoint(p, p, p.add(new Point(0, 1)));
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      } else if (event.code === 'KeyA') {
        this.actions.startAction('Sort symbol into staff');
        this.actions.sortSymbolIntoStaff(this.sheetOverlayService.selectedSymbol);
        this.actions.finishAction();
      } else if (event.code === 'KeyS') {
        if (this.sheetOverlayService.selectedSymbol.symbol === SymbolType.Note) {
          const n = this.sheetOverlayService.selectedSymbol as Note;
          this.actions.startAction('Change graphical connection');
          if (n.graphicalConnection !== GraphicalConnectionType.Looped) {
            this.actions.changeGraphicalConnection(n, GraphicalConnectionType.Looped);
          } else {
            this.actions.changeGraphicalConnection(n, GraphicalConnectionType.Gaped);
          }
          this.actions.finishAction();
        }
      } else if (event.code === 'KeyN') {
        this.actions.startAction('Change neume start');
        if (this.sheetOverlayService.selectedSymbol.symbol === SymbolType.Note) {
          const n = this.sheetOverlayService.selectedSymbol as Note;
          this.actions.changeNeumeStart(n, !n.isNeumeStart);
        }
        this.actions.finishAction();
      }
    }
  }
}
