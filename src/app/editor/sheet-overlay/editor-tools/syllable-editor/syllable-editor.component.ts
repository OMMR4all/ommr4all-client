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

const machina: any = require('machina');

@Component({
  selector: '[app-syllable-editor]',  // tslint:disable-line component-selector
  templateUrl: './syllable-editor.component.html',
  styleUrls: ['./syllable-editor.component.css']
})
export class SyllableEditorComponent extends EditorTool implements OnInit {
  get page() { return this.editorService.pcgts.page; }
  get currentSyllable() { return this.syllabelEditorService.currentSyllable; }
  syllables: Array<Syllable> = [];


  constructor(
    public sheetOverlayService: SheetOverlayService,
    private editorService: EditorService,
    private syllabelEditorService: SyllableEditorService,
    private actions: ActionsService,
  ) {
    super(sheetOverlayService);

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
          }
        },
        selected: {
          active: 'active',
          idle: 'idle',
          _onExit: () => {
            const nc = this.syllabelEditorService.selectedSyllableNeumeConnection;
            nc.c = null;
            nc.s = null;
            nc.n = null;
          }
        },
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
    if (this.state === 'selected') {
      this.states.handle('active');
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    if (this.state === 'active' || this.state === 'selected') {
      this.states.handle('active');
      if (symbol instanceof Note && this.syllabelEditorService.currentSyllable) {
        const note = symbol as Note;
        if (note.isNeumeStart) {
          this.actions.startAction(ActionType.SyllablesAddToNeume);
          this.actions.annotationAddNeumeConnection(this.page.annotations, symbol as Note, this.syllabelEditorService.currentSyllable);
          this._selectNext();
          this.actions.finishAction();
          event.stopPropagation();
          event.preventDefault();
        }
      }
    }
  }

  onSyllableMouseUp(event: MouseEvent, connection: Connection, syllableConnector: SyllableConnector, neumeConnector: NeumeConnector) {
    if (this.state === 'active' || this.state === 'selected') {
      this.states.handle('select');
      const nc = this.syllabelEditorService.selectedSyllableNeumeConnection;
      nc.c = connection;
      nc.s = syllableConnector;
      nc.n = neumeConnector;
      event.stopPropagation();
      event.preventDefault();
    }

  }

  onKeydown(event: KeyboardEvent) {
    if (this.state === 'active') {
      if (event.code === 'Tab') {
        if (event.shiftKey) {
          this.onSelectPrev();
        } else {
          this.onSelectNext();
        }
        event.stopPropagation();
        event.preventDefault();
      }
    } else if (this.state === 'selected') {
      if (event.code === 'Escape') {
        this.states.handle('active');
        event.stopPropagation();
        event.preventDefault();
      } else if (event.code === 'Delete') {
        this.actions.startAction(ActionType.SyllabelsDeleteConnection);
        const nc = this.syllabelEditorService.selectedSyllableNeumeConnection;
        if (nc.s && nc.n) {
          this.actions.syllableConnectorRemoveConnector(nc.s, nc.n);
        }
        this.actions.finishAction();
        this.states.handle('active');
        event.stopPropagation();
        event.preventDefault();
      }
    }
  }

}
