import {EventEmitter, Injectable, Output} from '@angular/core';
import {AccidentalType, ClefType, NoteType, SymbolType} from '../../data-types/page/definitions';

export enum PrimaryViews {
  Preprocessing,
  Editor,
}

export enum PreprocessingTools {

}

export enum EditorTools {
  CreateStaffLines,
  GroupStaffLines,
  SplitStaffLines,
  Layout,
  TextRegion,
  Symbol,
  Lyrics,
  Syllables,
}

@Injectable({
  providedIn: 'root'
})
export class ToolBarStateService {
  @Output() runStaffDetection = new EventEmitter();
  @Output() runLayoutAnalysis = new EventEmitter();
  @Output() runSymbolDetection = new EventEmitter();
  @Output() runSymbolTraining = new EventEmitter();
  @Output() runClearAllSymbols = new EventEmitter();
  @Output() runClearFullPage = new EventEmitter();

  private _currentPrimaryView = PrimaryViews.Editor;
  @Output() primaryViewChanged = new EventEmitter<{prev: PrimaryViews, next: PrimaryViews}>();

  private _currentEditorTool = EditorTools.CreateStaffLines;
  @Output() editorToolChanged = new EventEmitter<{prev: EditorTools, next: EditorTools}>();

  private _currentEditorSymbol = SymbolType.Note;
  @Output() editorSymbolChanged = new EventEmitter<SymbolType>();

  public currentClefType = ClefType.Clef_C;
  public currentNoteType = NoteType.Normal;
  public currentAccidentalType = AccidentalType.Flat;

  constructor() { }

  get currentPrimaryView(): PrimaryViews {
    return this._currentPrimaryView;
  }

  set currentPrimaryView(v: PrimaryViews) {
    if (this._currentPrimaryView !== v) {
      this.primaryViewChanged.emit({prev: this._currentPrimaryView, next: v});
      this._currentPrimaryView = v;
    }
  }

  get currentEditorTool(): EditorTools {
    return this._currentEditorTool;
  }

  set currentEditorTool(v: EditorTools) {
    if (this._currentEditorTool !== v) {
      this.editorToolChanged.emit({prev: this._currentEditorTool, next: v});
      this._currentEditorTool = v;
    }
  }

  get currentEditorSymbol(): SymbolType {
    return this._currentEditorSymbol;
  }

  set currentEditorSymbol(v: SymbolType) {
    this.currentEditorTool = EditorTools.Symbol;
    if (this._currentEditorSymbol !== v) {
      this.editorSymbolChanged.emit(v);
      this._currentEditorSymbol = v;
    }
  }
}
