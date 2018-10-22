import { Component, OnInit } from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor/editor.service';
import {Syllable} from '../../../data-types/page/syllable';
import {SyllableEditorService} from './syllable-editor.service';
import {Note, Symbol} from '../../../data-types/page/music-region/symbol';
import {Connection, NeumeConnector, SyllableConnector} from '../../../data-types/page/annotations';
const machina: any = require('machina');

@Component({
  selector: '[app-syllable-editor]',  // tslint:disable-line component-selector
  templateUrl: './syllable-editor.component.html',
  styleUrls: ['./syllable-editor.component.css']
})
export class SyllableEditorComponent extends EditorTool implements OnInit {
  get page() { return this.editorService.pcgts.page; }
  syllables: Array<Syllable> = [];


  constructor(
    public sheetOverlayService: SheetOverlayService,
    private editorService: EditorService,
    private syllabelEditorService: SyllableEditorService,
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

  selectNext() {
    let idx = this.syllables.indexOf(this.syllabelEditorService.currentSyllable) + 1;
    if (idx < 0) { idx = 0; }
    if (idx >= this.syllables.length) { idx = this.syllables.length - 1; }
    this.syllabelEditorService.currentSyllable = this.syllables[idx];
  }

  selectPrev() {
    let idx = this.syllables.indexOf(this.syllabelEditorService.currentSyllable) - 1;
    if (idx === -1) { idx = 0; }
    if (idx < 0) { idx = this.syllables.length - 1; }
    this.syllabelEditorService.currentSyllable = this.syllables[idx];
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
          this.page.annotations.addNeumeConnection(symbol as Note, this.syllabelEditorService.currentSyllable);
          this.selectNext();
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
          this.selectPrev();
        } else {
          this.selectNext();
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
        const nc = this.syllabelEditorService.selectedSyllableNeumeConnection;
        if (nc.s && nc.n) {
          nc.s.removeConnector(nc.n);
        }
        this.states.handle('active');
        event.stopPropagation();
        event.preventDefault();
      }
    }
  }

}
