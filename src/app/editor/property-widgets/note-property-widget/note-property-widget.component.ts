import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay/sheet-overlay.service';
import {Accidental, Clef, MusicSymbol, Note} from '../../../data-types/page/music-region/symbol';
import {GraphicalConnectionType, NoteType, SymbolErrorType} from '../../../data-types/page/definitions';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';
import {SymbolEditorComponent} from '../../sheet-overlay/editor-tools/symbol-editor/symbol-editor.component';

@Component({
  selector: 'app-note-property-widget',
  templateUrl: './note-property-widget.component.html',
  styleUrls: ['./note-property-widget.component.css'],
})
export class NotePropertyWidgetComponent implements OnInit {
  readonly NoteType = NoteType;

  @Input() selectedSymbol: MusicSymbol = null;
  @Input() symbolEditor: SymbolEditorComponent;
  @Output() noteChanged = new EventEmitter<MusicSymbol>();
  @Output() deleteNote = new EventEmitter<Note>();
  @Output() addNote = new EventEmitter<Note>();

  constructor(
    public sheetOverlayService: SheetOverlayService,
    private actions: ActionsService,
  ) { }

  ngOnInit() {
  }

  get note() {
    if (!this.selectedSymbol || !(this.selectedSymbol instanceof Note)) { return null; }
    return this.selectedSymbol as Note;
  }
  get debugSymbol() {
    if (this.selectedSymbol) {
      return this.selectedSymbol.debugSymbol;
    } else {
      return false;
    }
  }

  get  symbol() {
    if (this.selectedSymbol) {
      if (this.selectedSymbol instanceof Note) {
        return this.selectedSymbol as Note;
      }
      if (this.selectedSymbol instanceof Clef) {
        return this.selectedSymbol as Clef;
      }
      if (this.selectedSymbol instanceof Accidental) {
        return this.selectedSymbol as Accidental;
      }
      return null;
    }
    return null;

  }
  get confidenceSymbol() {
    if (this.selectedSymbol && this.selectedSymbol.symbolConfidence !== null) {
      return this.selectedSymbol.symbolConfidence.symbolErrorType === SymbolErrorType.SEQUENCE;
    } else {
      return false;
    }
  }
  get neumeStart() {
    return this.note.isNeumeStart;
  }

  set neumeStart(b: boolean) {
    this.actions.startAction(ActionType.SymbolsChangeNeumeStart);
    this.actions.changeNeumeStart(this.note, b);
    this.actions.finishAction();
    this.noteChanged.emit(this.note);
  }

  get connection() {
    return this.note.graphicalConnection === GraphicalConnectionType.Looped;
  }

  set connection(b: boolean) {
    this.actions.startAction(ActionType.SymbolsChangeGraphicalConnection);
    this.actions.changeGraphicalConnection(this.note, b ? GraphicalConnectionType.Looped : GraphicalConnectionType.Gaped);
    this.actions.finishAction();
    this.noteChanged.emit(this.note);
  }

  get fixedSorting() {
    return this.note.fixedSorting;
  }

  set fixedSorting(b: boolean) {
    this.actions.startAction(ActionType.SymbolsChangeFixedSorting);
    this.actions.changeFixedSorting(this.note, b);
    this.actions.finishAction();
    this.noteChanged.emit(this.note);
  }

  get missing() {
    return this.note.missing;
  }

  set missing(b: boolean) {
    this.actions.startAction(ActionType.SymbolsChangedMissing);
    this.actions.changeMissing(this.note, b);
    this.actions.finishAction();
    this.noteChanged.emit(this.note);
  }
  get noteType(): NoteType { return this.note.type; }
  set noteType(t: NoteType) {
    this.actions.startAction(ActionType.SymbolsChangeNoteType);
    this.actions.changeNoteType(this.note, t);
    this.actions.finishAction();
    this.noteChanged.emit(this.note);
  }

  onDelete() {
    this.deleteNote.emit(this.note);
  }
  addToSymbols() {
    this.addNote.emit(this.note);
  }
  acceptSymbols() {
    this.actions.startAction(ActionType.SymbolsChangeErrorType);
    this.actions.removeNoteErrorType(this.symbol.symbolConfidence, this.symbol);
    this.actions.finishAction();
    this.noteChanged.emit(this.symbol);
  }
  get keyboardMode() { return this.symbolEditor.keyboardMode; }
  set keyboardMode(m: boolean) { this.symbolEditor.keyboardMode = m; }
}
