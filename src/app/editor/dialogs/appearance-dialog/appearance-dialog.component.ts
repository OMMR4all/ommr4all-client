import {Component, HostListener, OnDestroy, OnInit, inject} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {Subscription} from 'rxjs';
import {
  APPEARANCE_GROUPS,
  APPEARANCE_GROUP_IDS,
  AppearanceGroupId,
  AppearanceSettingDef,
  appearanceGroupOfTool,
  appearanceSettingsOfGroup,
} from '../../appearance/appearance-settings';
import {ToolBarStateService} from '../../tool-bar/tool-bar-state.service';
import {UserViewSettingsService} from '../../../user-view-settings.service';

/**
 * Non-modal, draggable panel to customize how the sheet overlay is drawn.
 * It writes straight through to the user settings on every input event so the
 * result is visible on the sheet while a slider is being dragged.
 */
@Component({
    selector: 'app-appearance-dialog',
    templateUrl: './appearance-dialog.component.html',
    styleUrls: ['./appearance-dialog.component.scss'],
    standalone: false
})
export class AppearanceDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject<MatDialogRef<AppearanceDialogComponent>>(MatDialogRef);
  private settings = inject(UserViewSettingsService);
  private toolBarStateService = inject(ToolBarStateService);
  private _subscription: Subscription;

  readonly groups = APPEARANCE_GROUP_IDS;
  readonly groupTitles = APPEARANCE_GROUPS;
  expandedGroup: AppearanceGroupId;

  /** The panel is not modal, so keystrokes would otherwise reach the editor's
   *  global shortcut handlers (which listen on the document). */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
  }

  ngOnInit() {
    this.focusGroupOfCurrentTool();
    // follow the active editing step, but never fight a group the user opened
    this._subscription = this.toolBarStateService.editorToolChanged.subscribe(() => this.focusGroupOfCurrentTool());
  }

  ngOnDestroy() {
    if (this._subscription) { this._subscription.unsubscribe(); }
  }

  private focusGroupOfCurrentTool() {
    const group = appearanceGroupOfTool(this.toolBarStateService.currentEditorTool);
    if (group) { this.expandedGroup = group; }
  }

  settingsOfGroup(group: AppearanceGroupId): AppearanceSettingDef[] {
    return appearanceSettingsOfGroup(group);
  }

  value(setting: AppearanceSettingDef): string | number {
    return this.settings.appearance(setting.id);
  }

  numberValue(setting: AppearanceSettingDef): number {
    return this.settings.appearanceNumber(setting.id);
  }

  stringValue(setting: AppearanceSettingDef): string {
    return this.settings.appearanceString(setting.id);
  }

  onValueChanged(setting: AppearanceSettingDef, value: string | number) {
    if (value === null || value === undefined || value === '') { return; }
    this.settings.setAppearance(setting.id, setting.kind === 'color' || setting.kind === 'select'
      ? String(value) : Number(value));
  }

  onColorInput(setting: AppearanceSettingDef, event: Event) {
    this.onValueChanged(setting, (event.target as HTMLInputElement).value);
  }

  resetGroup(group: AppearanceGroupId) {
    this.settings.resetAppearance(group);
  }

  resetAll() {
    this.settings.resetAppearance();
  }

  isCustomized(group: AppearanceGroupId): boolean {
    return appearanceSettingsOfGroup(group).some(s => this.settings.isAppearanceCustomized(s.id));
  }

  close() {
    this.dialogRef.close();
  }
}
