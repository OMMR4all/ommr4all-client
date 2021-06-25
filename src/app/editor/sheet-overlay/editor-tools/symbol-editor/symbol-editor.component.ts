import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {SymbolEditorService} from './symbol-editor.service';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {Point} from '../../../../geometry/geometry';
import {EditorTools, ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {Accidental, Clef, MusicSymbol, Note} from '../../../../data-types/page/music-region/symbol';
import {AccidentalType, ClefType, GraphicalConnectionType, NoteType, SymbolType} from '../../../../data-types/page/definitions';
import {EditorTool} from '../editor-tool';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {copyFromList, copyList} from '../../../../utils/copy';
import {LogicalConnection, PageLine} from '../../../../data-types/page/pageLine';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {RequestChangedViewElement} from '../../../actions/changed-view-elements';
import {ViewSettings} from '../../views/view';
import {SymbolContextMenuComponent} from '../../context-menus/symbol-context-menu/symbol-context-menu.component';
import {Subscription} from 'rxjs';
import {Options, ShortcutService} from '../../../shortcut-overlay/shortcut.service';

const machina: any = require('machina');

@Component({
  selector: '[app-symbol-editor]',  // tslint:disable-line component-selector
  templateUrl: './symbol-editor.component.html',
  styleUrls: ['./symbol-editor.component.css']
})
export class SymbolEditorComponent extends EditorTool implements OnInit, OnDestroy {
  private readonly _subscriptions = new Subscription();
  @Input() symbolContextMenu: SymbolContextMenuComponent;
  public draggedNote: MusicSymbol = null;
  public prevNote: MusicSymbol = null;
  private _selectedSymbol: MusicSymbol = null;
  private _prevMousePoint: Point = null;
  private _draggedNoteInitialPosition: Point;
  private _draggedNoteInitialSnapToStaffPos: Point;
  private _draggedNoteInitialSorting: Array<MusicSymbol>;
  private clickPos: Point;
  public keyboardMode = false;

  get prevMousePoint() { return this._prevMousePoint; }
  readonly tooltips: Array<Partial<Options>> = [
    // tslint:disable-next-line:max-line-length
    { keys: this.hotkeys.symbols().mouse1, description: 'Select or Create a Symbol. It will be inserted to the previous neume', group: EditorTools.Symbol},
    // tslint:disable-next-line:max-line-length
    { keys: this.hotkeys.symbols().mouse1 + ' + ' + this.hotkeys.symbols().control2, description: 'Create a Symbol with a graphical connection', group: EditorTools.Symbol},

    // tslint:disable-next-line:max-line-length
    { keys: this.hotkeys.symbols().mouse1 + ' + ' + this.hotkeys.symbols().control2, description: 'Create a Symbol. A new Neume will be Created', group: EditorTools.Symbol},

    { keys: this.hotkeys.symbols().l_arrow, description: 'Select previous Symbol (A symbol has to be selected)', group: EditorTools.Symbol},
    { keys: this.hotkeys.symbols().r_arrow, description: 'Select next Symbol (A symbol has to be selected)', group: EditorTools.Symbol},
    { keys: this.hotkeys.symbols().d_arrow, description: 'Select lower Symbol (A symbol has to be selected)', group: EditorTools.Symbol},
    { keys: this.hotkeys.symbols().u_arrow, description: 'Select upper Symbol (A symbol has to be selected)', group: EditorTools.Symbol},
    { keys: this.hotkeys.symbols().u_arrow, description: 'Select upper Symbol (A symbol has to be selected)', group: EditorTools.Symbol},
    { keys: this.hotkeys.symbols().delete, description: 'Delete selected symbol', group: EditorTools.Symbol},
    { keys: 'A', description: 'Sort selected symbol into staff', group: EditorTools.Symbol},
    { keys: 'S', description: 'Invert selected symbols Graphical Connection property', group: EditorTools.Symbol},
    { keys: 'N', description: 'Invert selected symbols NeumeStart Property', group: EditorTools.Symbol},
    { keys: 'Q', description: 'Selected symbols graphical connected set to Neume start', group: EditorTools.Symbol},
    { keys: 'W', description: 'Selected symbols graphical connected set to Gaped', group: EditorTools.Symbol},
    { keys: 'E', description: 'Selected symbols graphical connected set to Looped', group: EditorTools.Symbol},

    // tslint:disable-next-line:max-line-length
    { keys: 'Digit', description: 'Change notetype of selected symbol based on digit (1=note 2=c_clef 3=f_clef 4= ...)', group: EditorTools.Symbol},
    { keys: this.hotkeys.symbols().mouse2, description: 'Open Context Menu on a selected symbol', group: EditorTools.Symbol},


  ];
  constructor(public symbolEditorService: SymbolEditorService,
              protected sheetOverlayService: SheetOverlayService,
              private toolBarStateService: ToolBarStateService,
              protected viewChanges: ViewChangesService,
              protected changeDetector: ChangeDetectorRef,
              private actions: ActionsService,
              private hotkeys: ShortcutService) {
    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(true, false, false, true, true, false),
      );
    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          _onEnter: () => {
            this.tooltips.forEach(obj => {this.hotkeys.deleteShortcut(obj); });
          }
        },
        active: {
          idle: 'idle',
          mouseOnSymbol: 'drag',
          mouseOnBackground: 'prepareInsert',
          mouseOnLogicalConnection: 'logicalConnectionPrepareSelect',
          shiftDown: 'prepareGraphicalConnection',
          controlDown: 'prepareLogicalConnection',
          _onEnter: () => {
            this.tooltips.forEach(obj => {this.hotkeys.addShortcut(obj); });
          }
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
              const symbolToDelete = this.selectedSymbol;
              this.rollSymbolSelection(+1);  // select next symbol
              this.actions.detachSymbol(symbolToDelete,
                this.sheetOverlayService.editorService.pcgts.page.annotations
              );
            }
            this.actions.finishAction();
            if (this._selectedSymbol) {
              this.states.transition('selected');
            } else {
              this.states.transition('active');
            }
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
  }

  get currentStaff(): PageLine {
    return this.sheetOverlayService.closestStaffToMouse;
  }

  get selectedSymbol() { return this._selectedSymbol; }
  get selectedCommentHolder() { return this._selectedSymbol; }

  get selectedLogicalConnection() { return this.symbolEditorService.selectedLogicalConnection; }
  set selectedLogicalConnection(lc: LogicalConnection) { this.symbolEditorService.selectedLogicalConnection = lc; }

  ngOnInit() {
    this._subscriptions.add(this.toolBarStateService.runInsertAllNeumeStarts.subscribe(() => this.onAutoInsertNeumeStarts()));
    this._subscriptions.add(this.toolBarStateService.runClearAllSymbols.subscribe(() => this.onClearAllSymbols()));
    this._subscriptions.add(this.toolBarStateService.runResetAllGraphicalConnections.subscribe(() => this.resetAllGraphicalConnections()));
    this._subscriptions.add(this.toolBarStateService.runResetAllLocigalConnections.subscribe(() => this.resetAllLogicalConnections()));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
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
        const s = MusicSymbol.fromType((this.prevNote) ? SymbolType.Note : this.toolBarStateService.currentEditorSymbol);
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

  onSymbolMouseDown(event: MouseEvent, symbol: MusicSymbol) {
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

  onSymbolMouseUp(event: MouseEvent, symbol: MusicSymbol) {
    this.onMouseUp(event);
  }

  onSymbolMouseMove(event: MouseEvent, symbol: MusicSymbol) {
    this.onMouseMove(event);
  }

  onSymbolContextMenu(event: MouseEvent, symbol: MusicSymbol) {
    this.symbolContextMenu.open(event.clientX, event.clientY, symbol);
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

  rollSymbolSelection(d: number) {
    if (!this._selectedSymbol) { return; }
    const _last = this._selectedSymbol;
    const allSymbols = this._selectedSymbol.staff.symbols;
    const newIdx = allSymbols.indexOf(this._selectedSymbol) + d;
    if (allSymbols.length <= newIdx) {
      const allLines = this._selectedSymbol.staff.block.page.allMusicLines(true);
      const newLine = allLines[allLines.indexOf(this.selectedSymbol.staff) + 1];
      if (newLine && newLine.symbols[0]) {
        this._selectedSymbol = newLine.symbols[0];
      }
    } else if (newIdx < 0) {
      const allLines = this._selectedSymbol.staff.block.page.allMusicLines(true);
      const newLine = allLines[allLines.indexOf(this.selectedSymbol.staff) - 1];
      if (newLine && newLine.symbols.length > 0) {
        this._selectedSymbol = newLine.symbols[newLine.symbols.length - 1];
      }
    } else {
      this._selectedSymbol = allSymbols[newIdx];
    }
    this.viewChanges.request([_last, this._selectedSymbol]);
  }

  rollLineSelection(d: number) {
    if (!this._selectedSymbol) { return; }
    const _last = this.selectedSymbol;
    const allLines = this._selectedSymbol.staff.block.page.allMusicLines(true);
    const newLine = allLines[allLines.indexOf(this.selectedSymbol.staff) + d];
    if (!newLine) { return; }
    this._selectedSymbol = newLine.closestSymbolToX(this._selectedSymbol.coord.x);
    this.viewChanges.request([_last, this._selectedSymbol]);
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
    if (event.code.startsWith('Digit')) {
      const active = this.actions.isActionActive();
      if (this.selectedSymbol && !active) {
        const n = Number(event.code[event.code.length - 1]);
        const newType = new Array<[SymbolType, NoteType | ClefType | AccidentalType]>(
          [SymbolType.Note, NoteType.Normal],
          [SymbolType.Clef, ClefType.Clef_C],
          [SymbolType.Clef, ClefType.Clef_F],
          [SymbolType.Accid, AccidentalType.Flat],
          [SymbolType.Accid, AccidentalType.Sharp],
          [SymbolType.Accid, AccidentalType.Natural],
        )[n - 1];
        if (event.ctrlKey) {
          this.actions.startAction(ActionType.SymbolsInsert);
          const s = MusicSymbol.fromType(newType[0], newType[1]);
          s.coord.copyFrom(this.selectedSymbol.coord);
          const offset = this.selectedSymbol.staff.avgStaffLineDistance / 2;
          s.coord.x += event.shiftKey ? -offset : offset;
          this.actions.attachSymbol(this.selectedSymbol.staff, s);
          this.actions.sortSymbolIntoStaff(s);
          this._selectedSymbol = s;
        } else {
          this.actions.startAction(ActionType.SymbolsChangeType);
          if (newType) {
            this._selectedSymbol = this.actions.changeSymbolType(this.selectedSymbol, newType[0], newType[1]);
          }
        }
        this.actions.finishAction();
      }
      event.preventDefault();
    } else if (event.code === 'Delete' || event.code === 'Backspace') {
      this.states.handle('delete');
      event.preventDefault();
    } else if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    } else if (event.code === 'ShiftLeft') {
      if  (!this.keyboardMode) {
        this.states.handle('shiftDown');
      }
      event.preventDefault();
    } else if (event.code === 'ControlLeft') {
      if (!this.keyboardMode) {
        this.states.handle('controlDown', this.selectedSymbol);
      }
      event.preventDefault();
    } else if (event.code === 'AltLeft') {
      event.preventDefault();
    } else if (this.selectedSymbol) {
      const p = this.selectedSymbol.coord;
      const s = this.selectedSymbol;
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        if (event.altKey) {
          this.actions.startAction(ActionType.SymbolsMove);
          this.actions.changePoint(p, p, p.add(new Point(1, 0)));
          this.actions.updateSymbolSnappedCoord(s);
          this.actions.finishAction();
        } else {
          this.rollSymbolSelection(+1);
        }
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        if (event.altKey) {
          this.actions.startAction(ActionType.SymbolsMove);
          this.actions.changePoint(p, p, p.add(new Point(-1, 0)));
          this.actions.updateSymbolSnappedCoord(s);
          this.actions.finishAction();
        } else {
          this.rollSymbolSelection(-1);
        }
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        if (event.altKey) {
          this.actions.startAction(ActionType.SymbolsMove);
          this.actions.changePoint(p, p, p.add(new Point(0, -1)));
          this.actions.updateSymbolSnappedCoord(s);
          this.actions.finishAction();
        } else {
          this.rollLineSelection(-1);
        }
      } else if (event.code === 'ArrowDown') {
        if (event.altKey) {
          event.preventDefault();
          this.actions.startAction(ActionType.SymbolsMove);
          this.actions.changePoint(p, p, p.add(new Point(0, 1)));
          this.actions.updateSymbolSnappedCoord(s);
          this.actions.finishAction();
        } else {
          this.rollLineSelection(+1);
        }
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
      } else if (this.selectedSymbol && this.selectedSymbol.symbol === SymbolType.Note) {
        const note = this.selectedSymbol as Note;
        if (event.code === 'KeyQ') {
          this.actions.startAction(ActionType.SymbolsChangeNeumeStart);
          this.actions.changeNeumeStart(note, true);
          this.actions.finishAction();
        } else if (event.code === 'KeyW') {
          this.actions.startAction(ActionType.SymbolsChangeGraphicalConnection);
          this.actions.changeNeumeStart(note, false);
          this.actions.changeGraphicalConnection(note, GraphicalConnectionType.Gaped);
          this.actions.finishAction();
        } else if (event.code === 'KeyE') {
          this.actions.startAction(ActionType.SymbolsChangeGraphicalConnection);
          this.actions.changeNeumeStart(note, false);
          this.actions.changeGraphicalConnection(note, GraphicalConnectionType.Looped);
          this.actions.finishAction();
        }
      }
    }
  }

  onClearAllSymbols() {
    this.actions.startAction(ActionType.SymbolsDeleteAll);
    this.actions.clearAllSymbols(this.sheetOverlayService.editorService.pcgts.page);
    this.actions.finishAction();
  }

  private onAutoInsertNeumeStarts() {
    this.actions.startAction(ActionType.SymbolsAutoInsertNeumeStart);
    this.sheetOverlayService.editorService.pcgts.page.musicRegions.forEach(mr =>
      mr.musicLines.forEach(ml => ml.getNotes().filter(n => n.graphicalConnection === GraphicalConnectionType.Gaped).forEach(n =>
        this.actions.changeNeumeStart(n, true)
      ))
    );
    this.actions.finishAction();
  }

  resetAllGraphicalConnections() {
    this.actions.startAction(ActionType.SymbolsResetGraphicalConnections);
    this.sheetOverlayService.editorService.pcgts.page.musicRegions.forEach(mr =>
      mr.musicLines.forEach(ml => ml.getNotes().filter(n => n.graphicalConnection === GraphicalConnectionType.Looped && !n.isNeumeStart).forEach(n =>
        this.actions.changeGraphicalConnection(n, GraphicalConnectionType.Gaped)
      ))
    );
    this.actions.finishAction();
  }

  resetAllLogicalConnections() {
    this.actions.startAction(ActionType.SymbolsResetGraphicalConnections);
    this.sheetOverlayService.editorService.pcgts.page.musicRegions.forEach(mr =>
      mr.musicLines.forEach(ml => ml.getNotes().filter(n => n.isNeumeStart).forEach(n => {
          this.actions.changeNeumeStart(n, false);
          this.actions.changeGraphicalConnection(n, GraphicalConnectionType.Gaped);
      }))
    );
    this.actions.finishAction();
  }

  receivePageMouseEvents(): boolean {
    return this.state === 'active' || this.state === 'selected' || this.state === 'logicalConnectionSelected' ||
      this.state === 'logicalConnectionPrepareSelect';
  }
  isSymbolSelectable(symbol: MusicSymbol): boolean {
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
