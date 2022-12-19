import {Component, HostListener, Input, OnInit} from '@angular/core';
import {EditorTools, ToolBarStateService} from './tool-bar-state.service';
import {AccidentalType, ClefType, NoteType, SymbolType} from '../../data-types/page/definitions';
import {DocumentState, EditorService, PageState} from '../editor.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';
import {ActionsService} from '../actions/actions.service';
import {PageProgressGroups} from '../../data-types/page-editing-progress';
import {BookMeta} from '../../book-list.service';
import {BookPermissionFlag} from '../../data-types/permissions';
import {ShortcutService} from '../shortcut-overlay/shortcut.service';
import {BookDocumentsService} from "../../book-documents.service";
import {WordDictionaryService} from '../sheet-overlay/editor-tools/text-editor/text-editor-overlay/highlighted-word/word-dictionary.service';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css']
})
export class ToolBarComponent implements OnInit {
  @Input() savingPossible = true;
  @Input() autoSaveRunning = false;
  @Input() editMode = false;
  @Input() editOnlyMode = false;
  @Input() bookMeta: BookMeta;
  @Input() pageState: PageState;
  EditorTools = EditorTools;
  SymbolType = SymbolType;
  NoteType = NoteType;
  ClefType = ClefType;
  AccidType = AccidentalType;
  Locks = PageProgressGroups;
  Flags = BookPermissionFlag;

  constructor(public toolBarStateService: ToolBarStateService,
              public sheetOverlay: SheetOverlayService,
              public editor: EditorService,
              public documentService: BookDocumentsService,
              public actions: ActionsService,
              private router: Router,
              private route: ActivatedRoute,
              private shortcuts: ShortcutService,
              public dictionaryService: WordDictionaryService) { }

  get viewOnly() { return !this.bookMeta.hasPermission(BookPermissionFlag.Edit) || this.pageState.progress.isVerified(); }

  ngOnInit() {
  }

  onBack() {
    this.route.paramMap.subscribe(
      params => { this.router.navigate(['book', params.get('book_id')]); },
    );
  }

  onRequestEditPage() { this.toolBarStateService.requestEditPage.emit(); }

  onSave() { this.editor.save(); this.dictionaryService.saveDictionary(); }

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

  onAccidType(accid: AccidentalType) {
    this.toolBarStateService.currentAccidentalType = accid;
    this.onEditorSymbol(SymbolType.Accid);
  }

  onLock(group: PageProgressGroups) {
    this.actions.actionLockToggle(this.editor.pageEditingProgress, group);
  }

  onLockAll() {
    this.actions.actionLockAll(this.editor.pageEditingProgress);
  }
  onShortcut() {
    this.shortcuts.openHelpModal();
  }
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    /*if (event.code === 'Digit1') {
      this.onEditorTool(EditorTools.CreateStaffLines);
    } else if (event.code === 'Digit2') {
      this.onEditorTool(EditorTools.GroupStaffLines);
    } else if (event.code === 'Digit3') {
      this.onEditorTool(EditorTools.Layout);
    } else if (event.code === 'Digit4') {
      this.onEditorTool(EditorTools.MusicSymbol);
    }*/
  }
}
