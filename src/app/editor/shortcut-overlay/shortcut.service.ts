import { Injectable, DOCUMENT, inject } from '@angular/core';

import {EventManager} from '@angular/platform-browser';
import {MatDialog} from '@angular/material/dialog';
import {HotkeyViewerComponent} from './hotkey-help-viewer/hotkey-viewer/hotkey-viewer.component';
import {EditorTools, ToolBarStateService} from '../tool-bar/tool-bar-state.service';

// html entity of unicode representations
const _symbols = {
control : '&#8984;', //         ⌘      Command, Cmd, Clover, (formerly) Apple
control2 : '&#8963;', //         ⌃      Control, Ctl, Ctrl
alt: '&#8997;', //         ⌥      Option, Opt, (Windows) Alt
lalt: 'lALT',
shift: '&#8679;', //         ⇧      Shift
caps_lock: '&#8682;', //         ⇪      Caps lock
return1: '&#8617;', //         ↩      Return, Carriage Return
return2: '&#8629;', // &crarr; ↵      Return, Carriage Return
return3: '&#9166;', //        ⏎      Return, Carriage Return
enter: '&#8996;', //        ⌤      Enter
delete: '&#9003;', //         ⌫      Delete, Backspace
f_delete: '&#8998;', //         ⌦      Forward Delete
escape: '&#9099;',   //      ⎋      Escape, Esc
r_arrow: '&#8594;', // &rarr;  →      Right arrow
l_arrow: '&#8592;', // &larr;  ←      Left arrow
u_arrow: '&#8593;', // &uarr;  ↑      Up arrow
d_arrow: '&#8595;', // &darr;  ↓      Down arrow
page_up: '&#8670;', //         ⇞      Page Up, PgUp
page_down: '&#8671;', //         ⇟      Page Down, PgDn
home: '&#8598;', //         ↖      Home
end: '&#8600;', //         ↘      End
clear: '&#8999;', //         ⌧      Clear
tab: '&#8677;', //         ⇥      Tab, Tab Right, Horizontal Tab
shift_tab: '&#8676;', //         ⇤      Shift Tab, Tab Left, Back-tab
space: '&#9251;', //         ␣      Space, Blank
mouse1: 'mouse1',
mouse2: 'mouse2',
mouse3: 'mouse3',

};

export interface Options {
  element: any;
  description: string | undefined;
  keys: string;
  group: EditorTools;
}

/** One editing step's shortcuts, as shown by the cheat sheet. */
export interface ShortcutGroup {
  group: EditorTools;
  title: string;
  /** True for the editing step that is active while the cheat sheet is opened. */
  current: boolean;
  shortcuts: {keys: string, description: string}[];
}

export const SHORTCUT_GROUP_TITLES = new Map<EditorTools, string>([
  [EditorTools.General, $localize`General`],
  [EditorTools.CreateStaffLines, $localize`Edit staff lines`],
  [EditorTools.GroupStaffLines, $localize`Group staff lines`],
  [EditorTools.SplitStaffLines, $localize`Split staff lines`],
  [EditorTools.Layout, $localize`Layout`],
  [EditorTools.LayoutExtractConnectedComponents, $localize`Extract connected components`],
  [EditorTools.LayoutLassoArea, $localize`Lasso region`],
  [EditorTools.LayoutSplitTextLines, $localize`Split text lines`],
  [EditorTools.LayoutMergeTextLines, $localize`Merge text lines`],
  [EditorTools.Symbol, $localize`Symbols`],
  [EditorTools.SymbolCopyArea, $localize`Copy symbol area`],
  [EditorTools.Lyrics, $localize`Lyrics`],
  [EditorTools.Syllables, $localize`Syllables`],
  [EditorTools.View, $localize`View`],
]);

@Injectable({
  providedIn: 'root'
})
export class ShortcutService {
  private eventManager = inject(EventManager);
  private dialog = inject(MatDialog);
  private document = inject<Document>(DOCUMENT);
  private toolBarState = inject(ToolBarStateService);

  // every editing step's shortcuts, keyed by the step that owns them. The
  // catalog is complete as soon as the overlay is built (all editor tools are
  // static ViewChildren, so they all exist), which is what lets the cheat sheet
  // show shortcuts of steps the user has not activated yet.
  private readonly _groups = new Map<EditorTools, {keys: string, description: string}[]>();
  defaults: Partial<Options> = {
  element: this.document
};

  constructor() {
    this.showCheatSheet();
  }
  symbols() {
    return _symbols;
  }

  showCheatSheet() {
    this.eventManager.addEventListener(this.defaults.element, 'keydown.shift.?', () => {
      this.dialog.closeAll();
      this.openHelpModal(this.toolBarState.currentEditorTool);
    });

  }

  /**
   * Registers the shortcuts of one editing step. `defaultGroup` is the step
   * that owns them; single entries may override it (the polyline editor is
   * shared between the staff line and the layout step).
   */
  registerShortcuts(defaultGroup: EditorTools, tooltips: Partial<Options>[]) {
    (tooltips || []).forEach(tooltip => {
      if (!tooltip.keys || !tooltip.description) { return; }
      let group = tooltip.group === undefined ? defaultGroup : tooltip.group;
      if (group === undefined || group === EditorTools.None) { group = EditorTools.General; }
      if (!this._groups.has(group)) { this._groups.set(group, []); }
      const shortcuts = this._groups.get(group);
      // the same tooltip is registered again whenever its tool is activated
      if (shortcuts.some(s => s.keys === tooltip.keys && s.description === tooltip.description)) { return; }
      shortcuts.push({keys: tooltip.keys, description: tooltip.description});
    });
  }

  /** All registered shortcuts, `first` (the active step) at the top. */
  shortcutGroups(first?: EditorTools): ShortcutGroup[] {
    const groups: ShortcutGroup[] = [];
    this._groups.forEach((shortcuts, group) => groups.push({
      group,
      title: SHORTCUT_GROUP_TITLES.get(group) || String(group),
      current: group === first,
      shortcuts,
    }));
    groups.sort((a, b) => {
      if (a.group === first) { return -1; }
      if (b.group === first) { return 1; }
      return a.title.localeCompare(b.title);
    });
    return groups;
  }

  addShortcut(options: Partial<Options>) {
    // kept for the editor tools, which re-register their tooltips on every
    // state change; registration is idempotent
    this.registerShortcuts(options.group, [options]);
  }

  /**
   * @deprecated No-op: shortcuts are no longer removed when a step is left, so
   * that the cheat sheet can list every step at once.
   */
  deleteShortcut(options: Partial<Options>) {  // eslint-disable-line @typescript-eslint/no-unused-vars
  }

  openHelpModal(currentTool?: EditorTools) {
    this.dialog.open(HotkeyViewerComponent, {
      width: '560px',
      data: this.shortcutGroups(currentTool),
    });
  }
}
