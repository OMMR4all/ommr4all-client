import {Component, HostListener, Input, OnInit} from '@angular/core';
import {EditorTools, ToolBarStateService} from './tool-bar-state.service';
import {AccidentalType, ClefType, NoteType, SymbolType} from '../../data-types/page/definitions';
import {EditorService} from '../editor.service';
import {TaskStatusCodes} from '../task';
import {ActivatedRoute, Router} from '@angular/router';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';
import {ActionsService} from '../actions/actions.service';
import {PageProgressGroups} from '../../data-types/page-editing-progress';
import {BookMeta} from '../../book-list.service';
import {BookPermissionFlag} from '../../data-types/permissions';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css']
})
export class ToolBarComponent implements OnInit {
  @Input() savingPossible = true;
  @Input() autoSaveRunning = false;
  @Input() isSymbolDetectionTraining = false;
  @Input() editMode = false;
  @Input() bookMeta: BookMeta;
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
              public actions: ActionsService,
              private router: Router,
              private route: ActivatedRoute) { }

  ngOnInit() {
  }

  onBack() {
    this.route.paramMap.subscribe(
      params => { this.router.navigate(['book', params.get('book_id')]); },
    );
  }

  onRequestEditPage() { this.toolBarStateService.requestEditPage.emit(); }

  onSave() { this.editor.save(); }

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
    this.editor.pageEditingProgress.toggleLocked(group);
  }

  onLockAll() {
    Object.values(PageProgressGroups).forEach(v => this.editor.pageEditingProgress.setLocked(v, true));
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
      this.onEditorTool(EditorTools.Symbol);
    }*/
  }
}
