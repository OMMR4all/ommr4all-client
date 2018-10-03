import {Component, HostListener, OnInit} from '@angular/core';
import {EditorTools, PreprocessingTools, PrimaryViews, ToolBarStateService} from './tool-bar-state.service';
import {ClefType, EquivIndex, NoteType, SymbolType} from '../data-types/page/definitions';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css']
})
export class ToolBarComponent implements OnInit {
  PrimaryViews = PrimaryViews;
  EditorTools = EditorTools;
  PreprocessingTools = PreprocessingTools;
  SymbolType = SymbolType;
  NoteType = NoteType;
  ClefType = ClefType;
  EquivIndex = EquivIndex;

  constructor(public toolBarStateService: ToolBarStateService) { }

  ngOnInit() {
  }

  onPrimaryTool(view: PrimaryViews) {
    this.toolBarStateService.currentPrimaryView = view;
  }

  onEditorTool(tool: EditorTools) {
    this.toolBarStateService.currentEditorTool = tool;
  }

  onEditorSymbol(symbol: SymbolType) {
    this.toolBarStateService.currentEditorSymbol = symbol;
  }

  onNoteType(note: NoteType) {
    this.toolBarStateService.currentNoteType = note;
    this.onEditorSymbol(SymbolType.Note);
  }

  onClefType(clef: ClefType) {
    this.toolBarStateService.currentClefType = clef;
    this.onEditorSymbol(SymbolType.Clef);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.toolBarStateService.currentPrimaryView === PrimaryViews.Editor) {
      if (event.code === 'Digit1') {
        this.onEditorTool(EditorTools.CreateStaffLines);
      } else if (event.code === 'Digit2') {
        this.onEditorTool(EditorTools.GroupStaffLines);
      } else if (event.code === 'Digit3') {
        this.onEditorTool(EditorTools.Symbol);
      } else if (event.code === 'Digit4') {
        this.onEditorTool(EditorTools.Lyrics);
      }
    }
  }
}
