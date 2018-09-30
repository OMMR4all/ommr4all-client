import {EventEmitter, Injectable, Output} from '@angular/core';
import {Symbol, SymbolType} from '../musical-symbols/symbol';

export enum PrimaryViews {
  Preprocessing,
  Editor,
}

export enum PreprocessingTools {

}

export enum EditorTools {
  AutomaticStaffDetection,
  CreateStaffLines,
  GroupStaffLines,
  TextRegion,
  Symbol,
  Lyrics,
}

@Injectable({
  providedIn: 'root'
})
export class ToolBarStateService {
  private _currentPrimaryView = PrimaryViews.Preprocessing;
  @Output() primaryViewChanged = new EventEmitter<{prev: PrimaryViews, next: PrimaryViews}>();

  private _currentEditorTool = EditorTools.CreateStaffLines;
  @Output() editorToolChanged = new EventEmitter<{prev: EditorTools, next: EditorTools}>();

  private _currentEditorSymbol = SymbolType.Note;
  @Output() editorSymbolChanged = new EventEmitter<SymbolType>();

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