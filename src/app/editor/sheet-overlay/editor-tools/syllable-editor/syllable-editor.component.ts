import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor.service';
import {Syllable} from '../../../../data-types/page/syllable';
import {SyllableEditorService} from './syllable-editor.service';
import {Note, MusicSymbol} from '../../../../data-types/page/music-region/symbol';
import {Connection, SyllableConnector} from '../../../../data-types/page/annotations';
import {ActionsService} from '../../../actions/actions.service';
import {CommandChangeProperty} from '../../../undo/util-commands';
import {ActionType} from '../../../actions/action-types';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';
import {Point} from '../../../../geometry/geometry';
import {SyllableClickEvent} from '../../../property-widgets/syllable-property-widget/full-lyrics-view/full-lyrics-view-line/full-lyrics-view-line.component';
import {LogicalConnection, PageLine} from '../../../../data-types/page/pageLine';
import {copyList} from '../../../../utils/copy';
import {Block} from '../../../../data-types/page/block';
import {Options, ShortcutService} from '../../../shortcut-overlay/shortcut.service';
import {EditorTools, ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {RequestChangedViewElement} from '../../../actions/changed-view-elements';
import {SymbolEditorService} from '../symbol-editor/symbol-editor.service';
import {GraphicalConnectionType, SymbolType} from '../../../../data-types/page/definitions';
import {Subscription} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {TaskWorker} from '../../../task';
import {AlgorithmRequest, AlgorithmTypes} from '../../../../book-view/book-step/algorithm-predictor-params';

const machina: any = require('machina');

@Component({
  selector: '[app-syllable-editor]',  // tslint:disable-line component-selector
  templateUrl: './syllable-editor.component.html',
  styleUrls: ['./syllable-editor.component.css']
})
export class SyllableEditorComponent extends EditorTool implements OnInit {
  private readonly _subscriptions = new Subscription();

  private _mouseDownPos = new Point(0, 0);
  private _selectedSyllableConnection: SyllableConnector = null;

  task = new TaskWorker(
    AlgorithmTypes.Postprocessing,
    this.http,
    this.sheetOverlayService.editorService.pageStateVal.pageCom,
  );
  set selectedSyllableConnection(sc: SyllableConnector) {
    if (this._selectedSyllableConnection !== sc) {
      const changes = [];
      if (sc) { changes.push(sc.neume); }
      if (this._selectedSyllableConnection) { changes.push(this._selectedSyllableConnection.neume); }
      this._selectedSyllableConnection = sc;
      this.viewChanges.request(changes);
    }
  }
  get selectedSyllableConnection() { return this._selectedSyllableConnection; }

  get selectedSyllable() {
    if (!this.selectedSyllableConnection) { return null; }
    return this.selectedSyllableConnection.syllable;
  }

  get page() { return this.editorService.pcgts.page; }
  get currentSyllable() { return this.syllabelEditorService.currentSyllable; }
  get syllableToInsert() { return this.syllabelEditorService.currentSyllable; }
  syllables: Array<Syllable> = [];

  private _prepareSelectSyllableConnector: SyllableConnector = null;
  private _prepareInsertConnection: Note = null;
  readonly tooltips: Array<Partial<Options>> = [
    // tslint:disable-next-line:max-line-length
    { keys: this.hotkeys.symbols().tab, description: 'Select next syllable', group: EditorTools.GroupStaffLines},
  ];
  constructor(
    public sheetOverlayService: SheetOverlayService,


    private editorService: EditorService,
    public symbolEditorService: SymbolEditorService,
    private syllabelEditorService: SyllableEditorService,
    private actions: ActionsService,
    private toolBarStateService: ToolBarStateService,
    private http: HttpClient,
    protected viewChanges: ViewChangesService,
    protected changeDetector: ChangeDetectorRef,
    private  hotkeys: ShortcutService,
  ) {
    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(
        true, false, true, true,
        true, false, true, true, true, false, false),
      );

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          _onEnter: () => {
            this.syllabelEditorService.currentSyllable = null;
            this.syllables = [];
            this.tooltips.forEach(obj => {this.hotkeys.deleteShortcut(obj); });
          },
          _onExit: () => {
            this.syllables = this.page.readingOrder.generateSyllables();
            if (this.syllables.length > 0) {
              this.syllabelEditorService.currentSyllable = this.findFirstSyllableWithoutConnection(this.syllables);
            } else {
              this.syllabelEditorService.currentSyllable = null;
            }
          }
        },
        active: {
          deactivate: 'idle',
          idle: 'idle',
          select: 'selected',
          mouseOnLogicalConnection: 'logicalConnectionPrepareSelect',
          logicalConnectionInsert: 'logicalConnectionInsert',
          _onEnter: () => {
            this.tooltips.forEach(obj => {this.hotkeys.addShortcut(obj); });

          },
          mouseOnSyllable: (sc: SyllableConnector) => {
            this.states.transition('prepareSelect', sc);
          },
          mouseDown: (p: Point) => {
            const closestNote = this.page.closesLogicalComponentToPosition(p);
            if (closestNote) {
              this.states.transition('prepareInsertConnection', closestNote);
            }
          },
        },
        selected: {
          mouseUp: 'active',
          cancel: 'active',
          idle: 'idle',
          mouseOnLogicalConnection: 'logicalConnectionPrepareSelect',
          logicalConnectionInsert: 'logicalConnectionInsert',

          _onEnter: (sc: SyllableConnector) => {
            this.selectedSyllableConnection = sc;
          },
          _onExit: () => {
            this.selectedSyllableConnection = null;
          },
          mouseOnSyllable: (sc: SyllableConnector) => {
            this.states.transition('prepareSelect', sc);
          },
          mouseDown: (p: Point) => {
            const closestNote = this.page.closesLogicalComponentToPosition(p);
            if (closestNote) {
              this.states.transition('prepareInsertConnection', closestNote);
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
            this.actions.changeGraphicalConnection(this.selectedLogicalConnection.dataNote, GraphicalConnectionType.Gaped);
            this.actions.finishAction();
            this.states.transition('active');
          }
        },
        logicalConnectionInsert: {
          cancel: 'active',
          finished: 'active',
          mouseUp: 'active',
          mouseDown: (p: Point) => {
            if (this.currentStaff) {
              this.actions.startAction(ActionType.SymbolsChangeNeumeStart);
              const s = this.currentStaff.closestSymbolToX(p.x, SymbolType.Note, false, true) as Note;
              if (s) {
                this.actions.changeNeumeStart(s, true);
              }
              this.actions.finishAction();
            }}
        },
        drag: {
          _onEnter: (sc: SyllableConnector) => {
            this.selectedSyllableConnection = sc;
            this.actions.startAction(ActionType.SyllablesAddToNeume);
          },
          mouseMove: (pos: Point) => {
            const out = this.actions.freeMoveSyllable(this.page, this.selectedSyllableConnection, pos);
            if (out) {
              this.selectedSyllableConnection = out;
            }
          },
          mouseUp: () => { this.states.transition('selected', this.selectedSyllableConnection); },
          _onExit: () => {
            this.actions.finishAction();
          }
        },
        prepareInsertConnection: {
          _onEnter: (note: Note) => {
            if (!note) { this.states.transition('active'); }
            this._prepareInsertConnection = note;
          },
          _onExit: () => {
            this._prepareInsertConnection = null;
          },
          cancel: 'active',
          mouseUp: (pos: Point) => {
            const closestNote = this.page.closesLogicalComponentToPosition(pos);
            if (closestNote && closestNote === this._prepareInsertConnection && closestNote.isSyllableConnectionAllowed()) {
              this.actions.startAction(ActionType.SyllablesAddToNeume);
              const c = this.actions.annotationAddSyllableNeumeConnection(this.page.annotations, closestNote, this.syllabelEditorService.currentSyllable);
              this.actions.freeMoveSyllable(this.page, c, pos);
              this._selectNext();
              this.actions.finishAction();
              this.selectedSyllableConnection = c;
              this.states.transition('selected');
            } else {
              this.states.transition('active');
            }
          }
        },
        prepareSelect: {
          _onEnter: (sc: SyllableConnector) => {
            if (!sc) { this.states.transition('active'); }
            this._prepareSelectSyllableConnector = sc;
          },
          _onExit: () => { this._prepareSelectSyllableConnector = null; },
          cancel: 'active',
          mouseUp: 'active',
          mouseMove: (pos: Point) => {
            if (pos.measure(this._mouseDownPos).lengthSqr() > 5 * 5) {
              this.states.transition('drag', this._prepareSelectSyllableConnector);
            }
          },
          mouseOnSyllable: (sc: SyllableConnector) => { this._prepareSelectSyllableConnector = sc; },
          mouseUpSyllable: (sc: SyllableConnector, pos: Point) => {
            if (sc === this._prepareSelectSyllableConnector) {
              this.states.transition('selected', sc);
            }
          }
        }
      }
    });
    this.syllabelEditorService.states = this._states;
  }

  private _selectNext() {
    let idx = this.syllables.indexOf(this.syllabelEditorService.currentSyllable) + 1;
    if (idx < 0) { idx = 0; }
    if (idx >= this.syllables.length) { idx = this.syllables.length - 1; }
    this.actions.run(new CommandChangeProperty(this.syllabelEditorService, 'currentSyllable', this.currentSyllable, this.syllables[idx]));
  }
  private _selectPrev() {
    let idx = this.syllables.indexOf(this.syllabelEditorService.currentSyllable) - 1;
    if (idx === -1) { idx = 0; }
    if (idx < 0) { idx = this.syllables.length - 1; }
    this.actions.run(new CommandChangeProperty(this.syllabelEditorService, 'currentSyllable', this.currentSyllable, this.syllables[idx]));
  }

  private findFirstSyllableWithoutConnection(syllables: Array<Syllable>) {
    const annotations = this.page.annotations;
    for (const s of syllables) {
      if (!annotations.findSyllableConnectorBySyllable(s)) {
        return s;
      }
    }
    return null;
  }
    get currentStaff(): PageLine {
      return this.sheetOverlayService.closestStaffToMouse;
    }
  onSelectNext() {
    this.actions.startAction(ActionType.SyllablesSelectNext);
    this._selectNext();
    this.actions.finishAction();
  }

  onSelectPrev() {
    this.actions.startAction(ActionType.SyllablesSelectPrev);
    this._selectPrev();
    this.actions.finishAction();
  }

  ngOnInit() {
    this._subscriptions.add(this.toolBarStateService.runPostprocessSymbolsSyllables.subscribe(() => this._requestExtract()));
    this._subscriptions.add(this.task.taskFinished.subscribe(res => {this._taskFinished(res); })
    );
  }

  private _requestExtract() {
    const requestBody = new AlgorithmRequest();
    requestBody.pcgts = this.sheetOverlayService.editorService.pageStateVal.pcgts.toJson();
    this.task.putTask(null, requestBody);
  }
  private _taskFinished(res) {
    const pageState = this.sheetOverlayService.editorService.pageStateVal;
    if (!res.musicLines) {
      console.error('No symbols transmitted.');
    } else {
      this.actions.startAction(ActionType.SymbolsChangeGraphicalConnection);
      res.musicLines.forEach(
        ml => {
          const musicLine = pageState.pcgts.page.musicLineById(ml.id);
          const symbols = ml.symbols.map(s => MusicSymbol.fromJson(s));
          const origSymbols = musicLine.symbols;
          const zippedSymbols = symbols.map((e, i) => [e, origSymbols[i]]);
          zippedSymbols.forEach(sys => {
            const sy = sys[0];
            const oSy = sys[1];
            if (oSy instanceof Note) {
              if (oSy.graphicalConnection !== sy.graphicalConnection) {
                this.actions.changeNeumeStart(oSy, false);

                this.actions.changeGraphicalConnection(oSy, sy.graphicalConnection);
              }
            }
          });

        }
      );
      this.actions.finishAction();

    }
  }
  onMouseDown(event: MouseEvent): void {
    const p = this.mouseToSvg(event);
    if (this.states.handle('mouseDown', p)) { event.preventDefault(); }
  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    if (this.statesHandle('mouseUp', p)) { event.preventDefault(); }
  }

  onMouseMove(event: MouseEvent) {
    if (this.statesHandle('mouseMove', this.sheetOverlayService.mouseToSvg(event))) { event.preventDefault(); }
  }

  onSymbolMouseUp(event: MouseEvent, symbol: MusicSymbol) {
    if (this.state === 'active' || this.state === 'selected') {
      this.states.handle('active');
      if (symbol instanceof Note && this.syllabelEditorService.currentSyllable) {
        const note = symbol as Note;
        if (note.isSyllableConnectionAllowed()) {
          this.actions.startAction(ActionType.SyllablesAddToNeume);
          this.actions.annotationAddSyllableNeumeConnection(this.page.annotations, symbol as Note, this.syllabelEditorService.currentSyllable);
          this._selectNext();
          this.actions.finishAction();
          event.preventDefault();
        }
      }
    }
  }

  onSyllableMouseDown(event: MouseEvent, sc: SyllableConnector) {
    this._mouseDownPos = this.sheetOverlayService.mouseToSvg(event);
    if (this.statesHandle('mouseOnSyllable', sc)) { event.preventDefault(); }
  }

  onSyllableMouseUp(event: MouseEvent, connection: Connection, syllableConnector: SyllableConnector) {
    if (this.statesHandle('mouseUpSyllable', syllableConnector, this.sheetOverlayService.mouseToSvg(event))) { event.preventDefault(); }
  }

  onSyllablePropertyWidgetClick(event: SyllableClickEvent) {
    const idx = this.syllables.indexOf(event.syllable);
    if (idx >= 0) { this.syllabelEditorService.currentSyllable = this.syllables[idx]; }

    if (event.connector) {
      this.selectedSyllableConnection = event.connector;
    }
  }
  onKeyup(event: KeyboardEvent) {
    if (event.code === 'ControlLeft') {
      this.states.handle('active');
      console.log(this.states.state);
      event.preventDefault();
    }
  }
  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    }  else if (event.code === 'ControlLeft') {
      this.states.handle('logicalConnectionInsert');
    }else if (this.state === 'active') {
      if (event.code === 'Tab') {
        if (event.shiftKey) {
          this.onSelectPrev();
        } else {
          this.onSelectNext();
        }
        event.preventDefault();
      }
    } else if (this.state === 'selected') {
      if (event.code === 'Delete' || event.code === 'Backspace') {
        this.actions.startAction(ActionType.SyllabelsDeleteConnection);
        const sc = this.selectedSyllableConnection;
        if (sc) {
          this.actions.connectionRemoveSyllableConnector(sc);
        }
        this.actions.finishAction();
        this.states.handle('active');
        event.preventDefault();
      }
    } else if (this.state === 'logicalConnectionSelected') {
      if (event.code === 'Delete' || event.code === 'Backspace') {
        this.states.handle('delete');
        event.preventDefault();
      }
    }
  }

  receivePageMouseEvents(): boolean { return true; }
  get selectedCommentHolder() { return this._selectedSyllableConnection; }

  get selectedLogicalConnection() { return this.symbolEditorService.selectedLogicalConnection; }
  set selectedLogicalConnection(lc: LogicalConnection) { this.symbolEditorService.selectedLogicalConnection = lc; }
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
  isLogicalConnectionSelectable(lc: LogicalConnection): boolean {
    return this.state === 'active' || this.state === 'selected' || this.state === 'logicalConnectionSelected' ||
      this.state === 'logicalConnectionPrepareSelect';
  }
}
