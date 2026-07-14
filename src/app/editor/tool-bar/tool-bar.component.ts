import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import {EditorTools, ToolBarStateService} from './tool-bar-state.service';
import {AccidentalType, ClefType, NoteType, SymbolType} from '../../data-types/page/definitions';
import {SYMBOL_CLASS_REGISTRY, SymbolClassDescriptor} from '../../data-types/page/symbol-class-registry';
import {defaultHiddenToolbarButtons, isForcedToolbarButton, ToolBarButtonDef, ToolBarSectionId, TOOLBAR_SECTION_TITLES, toolbarButtonsOfSection} from './tool-bar-buttons';
import {UserViewSettingsService} from '../../user-view-settings.service';
import {MatDialog} from '@angular/material/dialog';
import {ToolbarCustomizeDialogComponent, ToolbarCustomizeDialogData} from '../dialogs/toolbar-customize-dialog/toolbar-customize-dialog.component';
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
    styleUrls: ['./tool-bar.component.css'],
    standalone: false
})
export class ToolBarComponent implements OnInit {
  toolBarStateService = inject(ToolBarStateService);
  sheetOverlay = inject(SheetOverlayService);
  editor = inject(EditorService);
  documentService = inject(BookDocumentsService);
  actions = inject(ActionsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private shortcuts = inject(ShortcutService);
  dictionaryService = inject(WordDictionaryService);
  private viewSettings = inject(UserViewSettingsService);
  private matDialog = inject(MatDialog);

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
  symbolClasses = SYMBOL_CLASS_REGISTRY;

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

  onSymbolClass(sc: SymbolClassDescriptor) {
    if (sc.symbolType === SymbolType.Note) {
      this.onNoteType(sc.subType as NoteType);
    } else if (sc.symbolType === SymbolType.Clef) {
      this.onClefType(sc.subType as ClefType);
    } else if (sc.symbolType === SymbolType.Accid) {
      this.onAccidType(sc.subType as AccidentalType);
    }
  }

  isSymbolClassActive(sc: SymbolClassDescriptor): boolean {
    if (this.toolBarStateService.currentEditorSymbol !== sc.symbolType) {
      return false;
    }
    if (sc.symbolType === SymbolType.Note) {
      return this.toolBarStateService.currentNoteType === sc.subType;
    } else if (sc.symbolType === SymbolType.Clef) {
      return this.toolBarStateService.currentClefType === sc.subType;
    } else if (sc.symbolType === SymbolType.Accid) {
      return this.toolBarStateService.currentAccidentalType === sc.subType;
    }
    return false;
  }

  // tool-bar customization: buttons hidden by the user (or hidden by default,
  // as long as the user has not customized the section) are moved into the
  // section's overflow menu (see tool-bar-buttons.ts for the button catalog)
  private effectiveHiddenButtons(section: ToolBarSectionId): string[] {
    const stored = this.viewSettings.hiddenToolbarButtons(section);
    return stored !== undefined ? stored : defaultHiddenToolbarButtons(section);
  }

  visible(id: string): boolean {
    if (isForcedToolbarButton(id)) { return true; }
    const section = id.split('.')[0] as ToolBarSectionId;
    return this.effectiveHiddenButtons(section).indexOf(id) < 0;
  }

  hiddenButtonsOfSection(section: ToolBarSectionId): ToolBarButtonDef[] {
    return toolbarButtonsOfSection(section).filter(b => !this.visible(b.id));
  }

  hiddenSymbolClasses(): SymbolClassDescriptor[] {
    return this.symbolClasses.filter(sc => !this.visible(sc.id));
  }

  onCustomizeToolbar(section: ToolBarSectionId) {
    const data: ToolbarCustomizeDialogData = {
      sectionTitle: TOOLBAR_SECTION_TITLES[section],
      buttons: toolbarButtonsOfSection(section),
      hidden: this.effectiveHiddenButtons(section),
    };
    this.matDialog.open(ToolbarCustomizeDialogComponent, {data, width: '400px'}).afterClosed().subscribe(
      hidden => {
        if (hidden !== undefined) {
          this.viewSettings.setHiddenToolbarButtons(section, hidden);
        }
      }
    );
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
