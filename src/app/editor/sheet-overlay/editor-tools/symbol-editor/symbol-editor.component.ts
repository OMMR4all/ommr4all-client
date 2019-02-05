import {Component, OnInit} from '@angular/core';
import {SymbolEditorService} from './symbol-editor.service';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {Point} from '../../../../geometry/geometry';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {Accidental, Clef, Note, Symbol} from '../../../../data-types/page/music-region/symbol';
import {GraphicalConnectionType, SymbolType} from '../../../../data-types/page/definitions';
import {EditorTool} from '../editor-tool';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {copyFromList, copyList} from '../../../../utils/copy';
import {LogicalConnection, PageLine} from '../../../../data-types/page/pageLine';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {RequestChangedViewElement, RequestChangedViewElements} from '../../../actions/changed-view-elements';

const machina: any = require('machina');

@Component({
  selector: '[app-symbol-editor]',  // tslint:disable-line component-selector
  templateUrl: './symbol-editor.component.html',
  styleUrls: ['./symbol-editor.component.css']
})
export class SymbolEditorComponent extends EditorTool implements OnInit {
  public draggedNote: Symbol = null;
  public prevNote: Symbol = null;
  private _selectedSymbol: Symbol = null;
  private _prevMousePoint: Point = null;
  private _draggedNoteInitialPosition: Point;
  private _draggedNoteInitialSnapToStaffPos: Point;
  private _draggedNoteInitialSorting: Array<Symbol>;
  private clickPos: Point;

  get prevMousePoint() { return this._prevMousePoint; }

  constructor(public symbolEditorService: SymbolEditorService,
              protected sheetOverlayService: SheetOverlayService,
              private toolBarStateService: ToolBarStateService,
              private viewChanges: ViewChangesService,
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
          mouseOnLogicalConnection: 'logicalConnectionPrepareSelect',
          shiftDown: 'prepareGraphicalConnection',
          controlDown: 'prepareLogicalConnection',
        },
        prepareInsert: {
          finished: 'selected',
          cancel: 'active',
          mouseOnSymbol: 'drag',
          mouseUp: (args: {pos: Point}) => {
            this.states.handle('cancel');
          },
          mouseClick: (args: {pos: Point}) => {
            this._newSymbol(args.pos);
            this.states.handle('finished');
          },
          _onExit: () => {
            this.clickPos = null;
          }
        },
        drag: {
          delete: () => {
            this.states.handle('cancel');
            this.states.handle('delete');
          },
          mouseUp: () => { this.states.handle('finished'); },
          finished: () => {
            this.actions.changePoint2(this.draggedNote.coord, this._draggedNoteInitialPosition);
            this.actions.changePoint2(this.draggedNote.snappedCoord, this._draggedNoteInitialSnapToStaffPos);
            this.actions.changeArray2(this.draggedNote.staff.symbols, this._draggedNoteInitialSorting);
            this.states.transition('dragFinished', 'selected');
          },
          cancel: () => {
            if (this.draggedNote && this._draggedNoteInitialPosition) {
              this.draggedNote.coord.copyFrom(this._draggedNoteInitialPosition);
              this.draggedNote.snappedCoord.copyFrom(this._draggedNoteInitialSnapToStaffPos);
              copyFromList(this.draggedNote.staff.symbols, this._draggedNoteInitialSorting);
              this.viewChanges.request([this.draggedNote]);
            }
            this.states.transition('dragFinished', 'active');
          },
          _onEnter: () => {
            this.actions.startAction(ActionType.SymbolsDrag, [this.draggedNote]);
            this._draggedNoteInitialPosition = this.draggedNote.coord.copy();
            this._draggedNoteInitialSnapToStaffPos = this.draggedNote.snappedCoord.copy();
            this._draggedNoteInitialSorting = copyList(this.draggedNote.staff.symbols);
          },
          _onExit: () => {
          },
        },
        dragFinished: {
          _onEnter: (newState) => {
            this.actions.finishAction();
            this.draggedNote = null;
            this._draggedNoteInitialSnapToStaffPos = null;
            this._draggedNoteInitialSorting = null;
            this._draggedNoteInitialPosition = null;
            this.states.transition(newState);
          },
        },
        selected: {
          mouseOnSymbol: 'drag',
          mouseOnBackground: 'prepareInsert',
          mouseOnLogicalConnection: 'logicalConnectionPrepareSelect',
          shiftDown: 'prepareGraphicalConnection',
          controlDown: 'prepareLogicalConnection',
          delete: () => {
            this.actions.startAction(ActionType.SymbolsDelete);
            if (this.selectedSymbol) {
              this.actions.detachSymbol(this.selectedSymbol,
                this.sheetOverlayService.editorService.pcgts.page.annotations
              );
            }
            this._selectedSymbol = null;
            this.actions.finishAction();
            this.states.transition('active');
          },
          _onExit: () => {
            if (this._selectedSymbol) {
              const old = this._selectedSymbol;
              this._selectedSymbol = null;
              this.viewChanges.request([old]);
            }
          },
        },
        logicalConnectionPrepareSelect: {
          mouseUp: () => { this.states.handle('cancel'); },
          cancel: () => {
            const changes = this.selectedLogicalConnection.dataNote;
            this.selectedLogicalConnection = null;
            this.viewChanges.request([changes]);
            this.states.transition('active');
          },
          selected: 'logicalConnectionSelected',
        },
        logicalConnectionSelected: {
          _onExit: () => { this.selectedLogicalConnection = null; },
          cancel: 'active',
          finished: 'active',
          mouseOnSymbol: 'drag',
          mouseOnBackground: 'prepareInsert',
          mouseOnLogicalConnection: 'logicalConnectionPrepareSelect',
          delete: () => {
            this.actions.startAction(ActionType.SymbolsChangeNeumeStart);
            this.actions.changeNeumeStart(this.selectedLogicalConnection.dataNote, false);
            this.actions.finishAction();
            this.states.transition('active');
          }
        },
        prepareGraphicalConnection: {
          _onEnter: () => {
            this.prevNote = this.currentStaff.closestSymbolToX(this._prevMousePoint.x, SymbolType.Note, true) as Note;
          },
          cancel: () => { this.prevNote = null; this.states.transition('active'); },
          finished: 'active',
          shiftUp: () => { this.states.handle('cancel'); },
          mouseOnBackground: 'prepareInsertGraphicalConnection',
        },
        prepareInsertGraphicalConnection: {
          finished: 'prepareGraphicalConnection',
          cancel: 'prepareGraphicalConnection',
          shiftUp: 'prepareInsert',
          mouseOnSymbol: 'drag',
          mouseUp: (args: {pos: Point}) => {
            this.states.handle('cancel');
          },
          mouseClick: (args: {pos: Point}) => {
            this._newSymbol(args.pos);
            this.states.handle('finished');
          },
          _onExit: () => {
            this.prevNote = null;
            this.clickPos = null;
          }
        },
        prepareLogicalConnection: {
          _onEnter: () => {
            this.prevNote = this.currentStaff.closestSymbolToX(this._prevMousePoint.x, SymbolType.Note, true) as Note;
          },
          cancel: () => { this.prevNote = null; this.states.transition('active'); },
          finished: 'active',
          controlUp: () => { this.states.handle('cancel'); },
          mouseOnBackground: 'prepareInsertLogicalConnection',
        },
        prepareInsertLogicalConnection: {
          finished: 'prepareLogicalConnection',
          cancel: 'prepareLogicalConnection',
          controlUp: 'prepareInsert',
          mouseOnSymbol: 'drag',
          mouseUp: (args: {pos: Point}) => {
            this.states.handle('cancel');
          },
          mouseClick: (args: {pos: Point}) => {
            this._newSymbol(args.pos);
            this.states.handle('finished');
          },
          _onExit: () => {
            this.prevNote = null;
            this.clickPos = null;
          }
        },
      }
    });
    symbolEditorService.states = this._states;
    toolBarStateService.runClearAllSymbols.subscribe(() => this.onClearAllSymbols());
  }

  get currentStaff(): PageLine {
    return this.sheetOverlayService.closestStaffToMouse;
  }

  get selectedSymbol() { return this._selectedSymbol; }

  get selectedLogicalConnection() { return this.symbolEditorService.selectedLogicalConnection; }
  set selectedLogicalConnection(lc: LogicalConnection) { this.symbolEditorService.selectedLogicalConnection = lc; }

  ngOnInit() {
  }

  onMouseDown(event: MouseEvent) {
    if (event.button !== 0) { return; }

    this.clickPos = new Point(event.clientX, event.clientY);
    this.states.handle('mouseOnBackground');
  }

  private _newSymbol(p: Point) {
    if (this.currentStaff) {
      if (this.toolBarStateService.currentEditorSymbol === SymbolType.LogicalConnection) {
        this.actions.startAction(ActionType.SymbolsChangeNeumeStart);
        const s = this.currentStaff.closestSymbolToX(p.x, SymbolType.Note, false, true) as Note;
        if (s) {
          this.actions.changeNeumeStart(s, true);
        }
        this.actions.finishAction();
      } else {
        this.actions.startAction(ActionType.SymbolsInsert, [this._selectedSymbol].filter(s => s));
        const s = Symbol.fromType((this.prevNote) ? SymbolType.Note : this.toolBarStateService.currentEditorSymbol);
        this._selectedSymbol = s;
        s.coord = p;
        if (s.symbol === SymbolType.Note) {
          const n = s as Note;
          n.graphicalConnection = this.state === 'prepareInsertGraphicalConnection' ? GraphicalConnectionType.Looped : GraphicalConnectionType.Gaped;
          n.isNeumeStart = this.state === 'prepareInsertLogicalConnection';
          n.type = this.toolBarStateService.currentNoteType;
        } else if (s.symbol === SymbolType.Clef) {
          const c = s as Clef;
          c.type = this.toolBarStateService.currentClefType;
        } else if (s.symbol === SymbolType.Accid) {
          const a = s as Accidental;
          a.type = this.toolBarStateService.currentAccidentalType;
        }
        this.actions.attachSymbol(this.currentStaff, s);
        this.actions.sortSymbolIntoStaff(s);
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      }
    }
  }

  onMouseUp(event: MouseEvent) {
    if (event.button !== 0) { return; }

    const p = this.mouseToSvg(event);

    if (this.clickPos && this.clickPos.measure(new Point(event.clientX, event.clientY)).lengthSqr() < 100) {
      this.states.handle('mouseClick', {pos: p});
    } else {
      this.states.handle('mouseUp', {pos: p});
    }

    event.preventDefault();
    this._prevMousePoint = p;
  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevNote = null;
    if (this.states.state === 'drag') {
      if (this.selectedSymbol) {
        this.draggedNote.coord.translateLocal(p.measure(this._prevMousePoint));
        this.draggedNote.snappedCoord = this.draggedNote.computeSnappedCoord();
        this.draggedNote.staff.sortSymbol(this.draggedNote);
        this.viewChanges.request([this.draggedNote]);
      }
      event.preventDefault();
    } else if (this.state === 'prepareGraphicalConnection' || this.state === 'prepareInsertGraphicalConnection' ||
      this.state === 'prepareLogicalConnection' || this.state === 'prepareInsertLogicalConnection') {
      this.prevNote = this.currentStaff.closestSymbolToX(p.x, SymbolType.Note, true) as Note;
    }

    this._prevMousePoint = p;
  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (event.button !== 0) { return; }

    if (this.isSymbolSelectable(symbol)) {
      const oldSelected = this._selectedSymbol;
      this.draggedNote = symbol;
      this.draggedNote.snappedCoord = this.draggedNote.computeSnappedCoord();
      this.states.handle('mouseOnSymbol');
      this._selectedSymbol = symbol;
      this.viewChanges.request([oldSelected, this._selectedSymbol].filter(s => s));
    }
    event.preventDefault();
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    this.onMouseUp(event);
  }

  onSymbolMouseMove(event: MouseEvent, symbol: Symbol) {
    this.onMouseMove(event);
  }

  onLogicalConnectionMouseDown(event: MouseEvent, lc: LogicalConnection) {
    if (event.button !== 0) { return; }

    if (this.isLogicalConnectionSelectable(lc)) {
      this.states.handle('mouseOnLogicalConnection');
      const changes = new Array<RequestChangedViewElement>();
      if (this.selectedLogicalConnection) { changes.push(this.selectedLogicalConnection.dataNote); }
      this.selectedLogicalConnection = lc.dataNote ? lc : null;
      if (this.selectedLogicalConnection.dataNote) { changes.push(this.selectedLogicalConnection.dataNote); }
      this.viewChanges.request(changes);
      event.preventDefault();
    }
  }

  onLogicalConnectionMouseUp(event: MouseEvent, lc: LogicalConnection) {
    if (event.button !== 0) { return; }

    if (this.state === 'logicalConnectionPrepareSelect') {
      if (lc && lc === this.selectedLogicalConnection) {
        this.states.handle('selected');
      } else {
        this.states.handle('cancel');
      }
      event.preventDefault();
    }
  }

  onKeyup(event: KeyboardEvent) {
    if (event.code === 'ShiftLeft') {
      this.states.handle('shiftUp');
      event.preventDefault();
    } else if (event.code === 'ControlLeft') {
      this.states.handle('controlUp');
      event.preventDefault();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Delete') {
      this.states.handle('delete');
      event.preventDefault();
    } else if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    } else if (event.code === 'ShiftLeft') {
      this.states.handle('shiftDown');
      event.preventDefault();
    } else if (event.code === 'ControlLeft') {
      this.states.handle('controlDown');
      event.preventDefault();
    } else if (this.selectedSymbol) {
      const p = this.selectedSymbol.coord;
      const s = this.selectedSymbol;
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        this.actions.startAction(ActionType.SymbolsMove);
        this.actions.changePoint(p, p, p.add(new Point(1, 0)));
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        this.actions.startAction(ActionType.SymbolsMove);
        this.actions.changePoint(p, p, p.add(new Point(-1, 0)));
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        this.actions.startAction(ActionType.SymbolsMove);
        this.actions.changePoint(p, p, p.add(new Point(0, -1)));
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        this.actions.startAction(ActionType.SymbolsMove);
        this.actions.changePoint(p, p, p.add(new Point(0, 1)));
        this.actions.updateSymbolSnappedCoord(s);
        this.actions.finishAction();
      } else if (event.code === 'KeyA') {
        this.actions.startAction(ActionType.SymbolsSortOrder);
        this.actions.sortSymbolIntoStaff(this.selectedSymbol);
        this.actions.finishAction();
      } else if (event.code === 'KeyS') {
        if (this.selectedSymbol.symbol === SymbolType.Note) {
          const n = this.selectedSymbol as Note;
          this.actions.startAction(ActionType.SymbolsChangeGraphicalConnection);
          if (n.graphicalConnection !== GraphicalConnectionType.Looped) {
            this.actions.changeGraphicalConnection(n, GraphicalConnectionType.Looped);
          } else {
            this.actions.changeGraphicalConnection(n, GraphicalConnectionType.Gaped);
          }
          this.actions.finishAction();
        }
      } else if (event.code === 'KeyN') {
        this.actions.startAction(ActionType.SymbolsChangeNeumeStart);
        if (this.selectedSymbol.symbol === SymbolType.Note) {
          const n = this.selectedSymbol as Note;
          this.actions.changeNeumeStart(n, !n.isNeumeStart);
        }
        this.actions.finishAction();
      }
    }
  }

  onClearAllSymbols() {
    this.actions.startAction(ActionType.SymbolsDeleteAll);
    this.sheetOverlayService.editorService.pcgts.page.musicRegions.forEach(mr =>
      mr.musicLines.forEach(ml => { while (ml.symbols.length > 0) {
        this.actions.detachSymbol(ml.symbols[0], this.sheetOverlayService.editorService.pcgts.page.annotations);
      } })
    );
    this.actions.finishAction();
  }

  receivePageMouseEvents(): boolean {
    return this.state === 'active' || this.state === 'selected' || this.state === 'logicalConnectionSelected' ||
      this.state === 'logicalConnectionPrepareSelect';
  }
  isSymbolSelectable(symbol: Symbol): boolean {
    return this.state === 'active' || this.state === 'selected' || this.state === 'logicalConnectionSelected' || this.state === 'dragFinished';
  }
  isLogicalConnectionSelectable(lc: LogicalConnection): boolean {
    return this.state === 'active' || this.state === 'selected' || this.state === 'logicalConnectionSelected' ||
      this.state === 'logicalConnectionPrepareSelect';
  }
  useCrossHairCursor() {
    return this.state === 'active' || this.state === 'selected' || this.state === 'logicalConnectionSelected' ||
      this.state === 'prepareGraphicalConnection' || this.state === 'prepareInsertGraphicalConnection' ||
      this.state === 'prepareLogicalConnection' || this.state === 'prepareInsertLogicalConnection';
  }
  useMoveCursor() { return this.state === 'drag'; }
}
