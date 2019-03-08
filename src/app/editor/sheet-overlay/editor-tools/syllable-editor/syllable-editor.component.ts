import {Component, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor.service';
import {Syllable} from '../../../../data-types/page/syllable';
import {SyllableEditorService} from './syllable-editor.service';
import {Note, Symbol} from '../../../../data-types/page/music-region/symbol';
import {Connection, NeumeConnector, SyllableConnector} from '../../../../data-types/page/annotations';
import {ActionsService} from '../../../actions/actions.service';
import {CommandChangeProperty} from '../../../undo/util-commands';
import {ActionType} from '../../../actions/action-types';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';
import {Point} from '../../../../geometry/geometry';
import {SymbolType} from '../../../../data-types/page/definitions';
import {SyllableClickEvent} from '../../../property-widgets/syllable-property-widget/full-lyrics-view/full-lyrics-view-line/full-lyrics-view-line.component';

const machina: any = require('machina');

@Component({
  selector: '[app-syllable-editor]',  // tslint:disable-line component-selector
  templateUrl: './syllable-editor.component.html',
  styleUrls: ['./syllable-editor.component.css']
})
export class SyllableEditorComponent extends EditorTool implements OnInit {
  private _mouseDownPos = new Point(0, 0);
  private _selectedSyllableNeumeConnection: NeumeConnector = null;
  set selectedSyllableNeumeConnection(nc: NeumeConnector) {
    if (this._selectedSyllableNeumeConnection !== nc) {
      const changes = [];
      if (nc) { changes.push(nc.neume); }
      if (this._selectedSyllableNeumeConnection) { changes.push(this._selectedSyllableNeumeConnection.neume); }
      this._selectedSyllableNeumeConnection = nc;
      this.viewChanges.request(changes);
    }
  }
  get selectedSyllableNeumeConnection() { return this._selectedSyllableNeumeConnection; }

  get selectedNeumeConnection() { return this.selectedSyllableNeumeConnection; }
  get selectedSyllable() {
    if (!this.selectedSyllableNeumeConnection) { return null; }
    return this.selectedSyllableNeumeConnection.syllableConnector.syllable;
  }

  get page() { return this.editorService.pcgts.page; }
  get currentSyllable() { return this.syllabelEditorService.currentSyllable; }
  get syllableToInsert() { return this.syllabelEditorService.currentSyllable; }
  syllables: Array<Syllable> = [];

  private _prepareSelectNeumeConnector: NeumeConnector = null;

  constructor(
    public sheetOverlayService: SheetOverlayService,
    private editorService: EditorService,
    private syllabelEditorService: SyllableEditorService,
    private actions: ActionsService,
    protected viewChanges: ViewChangesService,
  ) {
    super(sheetOverlayService, viewChanges,
      new ViewSettings(
        true, false, true, true,
        true, false, true),
      );

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          _onEnter: () => {
            this.syllabelEditorService.currentSyllable = null;
            this.syllables = [];
          },
          _onExit: () => {
            this.syllables = this.page.readingOrder.generateSyllables();
            if (this.syllables.length > 0) {
              this.syllabelEditorService.currentSyllable = this.syllables[0];
            } else {
              this.syllabelEditorService.currentSyllable = null;
            }
            console.log(this.syllables);
          }
        },
        active: {
          deactivate: 'idle',
          idle: 'idle',
          select: 'selected',
          _onEnter: () => {
          },
          mouseOnSyllable: (nc: NeumeConnector) => {
            this.states.transition('prepareSelect', nc);
          },
        },
        selected: {
          mouseUp: 'active',
          cancel: 'active',
          idle: 'idle',
          _onEnter: (nc: NeumeConnector) => {
            this.selectedSyllableNeumeConnection = nc;
          },
          _onExit: () => {
            this.selectedSyllableNeumeConnection = null;
          },
          mouseOnSyllable: (nc: NeumeConnector) => {
            this.states.transition('prepareSelect', nc);
          },
        },
        drag: {
          _onEnter: (nc: NeumeConnector) => {
            this.selectedSyllableNeumeConnection = nc;
            this.actions.startAction(ActionType.SyllablesAddToNeume);
          },
          mouseMove: (pos: Point) => {
            const closest = this.selectedSyllableNeumeConnection.neume.staff.closestSymbolToX(pos.x, SymbolType.Note) as Note;
            if (closest.isSyllableConnectionAllowed()) {
              this.actions.syllableConnectorRemoveConnector(this.selectedSyllableNeumeConnection.syllableConnector, this.selectedSyllableNeumeConnection);
              this.selectedSyllableNeumeConnection = this.actions.annotationAddNeumeConnection(this.page.annotations, closest, this.selectedSyllableNeumeConnection.syllableConnector.syllable);
            }
          },
          mouseUp: () => { this.states.transition('selected', this.selectedSyllableNeumeConnection); },
          _onExit: () => {
            this.actions.finishAction();
          }
        },
        prepareSelect: {
          _onEnter: (nc: NeumeConnector) => {
            if (!nc) { this.states.transition('active'); }
            this._prepareSelectNeumeConnector = nc;
          },
          _onExit: () => { this._prepareSelectNeumeConnector = null; },
          cancel: 'active',
          mouseUp: 'active',
          mouseMove: (pos: Point) => {
            if (pos.measure(this._mouseDownPos).lengthSqr() > 5 * 5) {
              this.states.transition('drag', this._prepareSelectNeumeConnector);
            }
          },
          mouseOnSyllable: (nc: NeumeConnector) => { this._prepareSelectNeumeConnector = nc; },
          mouseUpSyllable: (nc: NeumeConnector, pos: Point) => {
            if (nc === this._prepareSelectNeumeConnector) {
              this.states.transition('selected', nc);
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
  }

  onMouseUp(event: MouseEvent) {
    if (this.statesHandle('mouseUp')) { event.preventDefault(); }
  }

  onMouseMove(event: MouseEvent) {
    if (this.statesHandle('mouseMove', this.sheetOverlayService.mouseToSvg(event))) { event.preventDefault(); }
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    if (this.state === 'active' || this.state === 'selected') {
      this.states.handle('active');
      if (symbol instanceof Note && this.syllabelEditorService.currentSyllable) {
        const note = symbol as Note;
        if (note.isSyllableConnectionAllowed()) {
          this.actions.startAction(ActionType.SyllablesAddToNeume);
          this.actions.annotationAddNeumeConnection(this.page.annotations, symbol as Note, this.syllabelEditorService.currentSyllable);
          this._selectNext();
          this.actions.finishAction();
          event.preventDefault();
        }
      }
    }
  }

  onSyllableMouseDown(event: MouseEvent, neumeConnector: NeumeConnector) {
    this._mouseDownPos = this.sheetOverlayService.mouseToSvg(event);
    if (this.statesHandle('mouseOnSyllable', neumeConnector)) { event.preventDefault(); }
  }

  onSyllableMouseUp(event: MouseEvent, connection: Connection, syllableConnector: SyllableConnector, neumeConnector: NeumeConnector) {
    if (this.statesHandle('mouseUpSyllable', neumeConnector, this.sheetOverlayService.mouseToSvg(event))) { event.preventDefault(); }
  }

  onSyllablePropertyWidgetClick(event: SyllableClickEvent) {
    const idx = this.syllables.indexOf(event.syllable);
    if (idx >= 0) { this.syllabelEditorService.currentSyllable = this.syllables[idx]; }

    if (event.connector && event.connector.neumeConnectors.length > 0) {
      this.selectedSyllableNeumeConnection = event.connector.neumeConnectors[0];
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    } else if (this.state === 'active') {
      if (event.code === 'Tab') {
        if (event.shiftKey) {
          this.onSelectPrev();
        } else {
          this.onSelectNext();
        }
        event.preventDefault();
      }
    } else if (this.state === 'selected') {
      if (event.code === 'Delete') {
        this.actions.startAction(ActionType.SyllabelsDeleteConnection);
        const nc = this.selectedSyllableNeumeConnection;
        if (nc) {
          this.actions.syllableConnectorRemoveConnector(nc.syllableConnector, nc);
        }
        this.actions.finishAction();
        this.states.handle('active');
        event.preventDefault();
      }
    }
  }

  receivePageMouseEvents(): boolean { return true; }

}
