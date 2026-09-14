import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import {EditorTools, ToolBarStateService} from './tool-bar-state.service';
import {AccidentalType, ClefType, NoteType, SymbolType} from '../../data-types/page/definitions';
import {SymbolClassDescriptor} from '../../data-types/page/symbol-class-registry';
import {SymbolClassService} from '../../symbol-class.service';
import {defaultHiddenToolbarButtons, isForcedToolbarButton, ToolBarButtonDef, ToolBarSectionId, TOOLBAR_SECTION_TITLES, toolbarButtonsOfSection} from './tool-bar-buttons';
import {UserViewSettingsService} from '../../user-view-settings.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ToolbarCustomizeDialogComponent, ToolbarCustomizeDialogData} from '../dialogs/toolbar-customize-dialog/toolbar-customize-dialog.component';
import {AppearanceDialogComponent} from '../dialogs/appearance-dialog/appearance-dialog.component';
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
import {AuthenticationService, GlobalPermissions} from '../../authentication/authentication.service';
import {SymbolClassDialogComponent, SymbolClassDialogData} from '../../administrative-view/administrative-view-symbol-classes/symbol-class-dialog/symbol-class-dialog.component';

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
  private symbolClassService = inject(SymbolClassService);
  private authentication = inject(AuthenticationService);

  @Input() savingPossible = true;
  @Input() autoSaveRunning = false;
  @Input() editMode = false;
  @Input() editOnlyMode = false;
  @Input() bookMeta: BookMeta;
  @Input() pageState: PageState;
  /** Pages of this book assigned to the logged-in user; 0 hides the jump button. */
  @Input() assignedPageCount = 0;
  EditorTools = EditorTools;
  SymbolType = SymbolType;
  NoteType = NoteType;
  ClefType = ClefType;
  AccidType = AccidentalType;
  Locks = PageProgressGroups;
  Flags = BookPermissionFlag;
  get symbolClasses(): SymbolClassDescriptor[] { return this.symbolClassService.descriptors; }
  /** The classes that get a tool-bar button; the rest are annotated through a property widget. */
  get paletteSymbolClasses(): SymbolClassDescriptor[] {
    return this.symbolClasses.filter(sc => sc.paletteButton !== false);
  }
  private _appearanceDialog: MatDialogRef<AppearanceDialogComponent>;

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
    this.toolBarStateService.currentSymbolClass = sc.classId || null;
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
    if (this.toolBarStateService.currentSymbolClass !== (sc.classId || null)) {
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
    return stored !== undefined ? stored : defaultHiddenToolbarButtons(section, this.symbolClasses);
  }

  visible(id: string): boolean {
    if (isForcedToolbarButton(id)) { return true; }
    const section = id.split('.')[0] as ToolBarSectionId;
    return this.effectiveHiddenButtons(section).indexOf(id) < 0;
  }

  hiddenButtonsOfSection(section: ToolBarSectionId): ToolBarButtonDef[] {
    return toolbarButtonsOfSection(section, this.symbolClasses).filter(b => !this.visible(b.id));
  }

  hiddenSymbolClasses(): SymbolClassDescriptor[] {
    return this.paletteSymbolClasses.filter(sc => !this.visible(sc.id));
  }

  onCustomizeToolbar(section: ToolBarSectionId) {
    const data: ToolbarCustomizeDialogData = {
      sectionTitle: TOOLBAR_SECTION_TITLES[section],
      buttons: toolbarButtonsOfSection(section, this.symbolClasses),
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

  get mayAddSymbolClass() {
    return this.authentication.hasPermission(GlobalPermissions.AddSymbolClass);
  }

  /** Registers a new symbol class without leaving the page that needs it. */
  onAddSymbolClass() {
    const data: SymbolClassDialogData = {
      def: null,
      // default to this book's style, a class of another style never reaches this tool bar
      defaultStyle: this.symbolClassService.activeStyleId,
    };
    this.matDialog.open(SymbolClassDialogComponent, {maxWidth: '860px', data}).afterClosed().subscribe(
      changed => {
        // reload() drops the descriptor memo, so the new button shows up right away
        if (changed) { this.symbolClassService.reload(); }
      }
    );
  }

  onCustomizeAppearance() {
    if (this._appearanceDialog) {
      this._appearanceDialog.close();
      return;
    }
    // non-modal: no backdrop, so the sheet stays editable and every change is
    // visible while a slider is dragged
    this._appearanceDialog = this.matDialog.open(AppearanceDialogComponent, {
      hasBackdrop: false,
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
      width: '340px',
      position: {top: '90px', right: '24px'},
      panelClass: 'appearance-dialog-pane',
    });
    this._appearanceDialog.afterClosed().subscribe(() => this._appearanceDialog = undefined);
  }

  onLock(group: PageProgressGroups) {
    this.actions.actionLockToggle(this.editor.pageEditingProgress, group);
  }

  onLockAll() {
    this.actions.actionLockAll(this.editor.pageEditingProgress);
  }
  onShortcut() {
    // the active step's shortcuts are listed first and expanded
    this.shortcuts.openHelpModal(this.toolBarStateService.currentEditorTool);
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
