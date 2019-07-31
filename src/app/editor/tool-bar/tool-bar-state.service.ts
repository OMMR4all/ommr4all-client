import {EventEmitter, Injectable, Output} from '@angular/core';
import {AccidentalType, ClefType, NoteType, SymbolType} from '../../data-types/page/definitions';
import {PageProgressGroups} from '../../data-types/page-editing-progress';

export enum EditorTools {
  View,

  CreateStaffLines,
  GroupStaffLines,
  SplitStaffLines,

  Layout,
  LayoutExtractConnectedComponents,
  LayoutLassoArea,

  Symbol,

  Lyrics,
  Syllables,
}

export const editorToolToProgressGroup = [
  null,
  PageProgressGroups.StaffLines, PageProgressGroups.StaffLines, PageProgressGroups.StaffLines,
  PageProgressGroups.Layout, PageProgressGroups.Layout, PageProgressGroups.Layout,
  PageProgressGroups.Symbols,
  PageProgressGroups.Text,
  PageProgressGroups.Text,
];

@Injectable({
  providedIn: 'root'
})
export class ToolBarStateService {
  @Output() runStaffDetection = new EventEmitter();
  @Output() runClearAllStaves = new EventEmitter();
  @Output() runLayoutAnalysis = new EventEmitter();
  @Output() runClearAllLayout = new EventEmitter();
  @Output() runSymbolDetection = new EventEmitter();
  @Output() runInsertAllNeumeStarts = new EventEmitter();
  @Output() runClearAllSymbols = new EventEmitter();
  @Output() runResetAllLocigalConnections = new EventEmitter();
  @Output() runResetAllGraphicalConnections = new EventEmitter();
  @Output() runAutoReadingOrder = new EventEmitter();
  @Output() runLyricsPasteTool = new EventEmitter();
  @Output() runClearAllTexts = new EventEmitter();
  @Output() runClearFullPage = new EventEmitter();
  @Output() requestEditPage = new EventEmitter();
  @Output() runAutoSyllable = new EventEmitter();

  private _currentEditorTool = EditorTools.View;
  @Output() editorToolChanged = new EventEmitter<{prev: EditorTools, next: EditorTools}>();

  private _currentEditorSymbol = SymbolType.Note;
  @Output() editorSymbolChanged = new EventEmitter<SymbolType>();

  public currentClefType = ClefType.Clef_C;
  public currentNoteType = NoteType.Normal;
  public currentAccidentalType = AccidentalType.Flat;

  constructor() { }

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
