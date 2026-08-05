import { Component, inject } from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ShortcutGroup} from '../../shortcut.service';

@Component({
    selector: 'app-hotkey-viewer',
    templateUrl: './hotkey-viewer.component.html',
    styleUrls: ['./hotkey-viewer.component.scss'],
    standalone: false
})
export class HotkeyViewerComponent {
  // the first group is the editing step that is currently active
  readonly groups: ShortcutGroup[] = inject(MAT_DIALOG_DATA) || [];

  filter = '';

  onFilter(value: string) {
    this.filter = value.trim().toLowerCase();
  }

  /** Groups with at least one shortcut matching the filter. */
  get visibleGroups(): ShortcutGroup[] {
    if (!this.filter) { return this.groups; }
    return this.groups
      .map(g => ({...g, shortcuts: g.shortcuts.filter(s => this.matches(s.description) || this.matches(s.keys))}))
      .filter(g => g.shortcuts.length > 0);
  }

  private matches(text: string): boolean {
    return this.htmlDecode(text).toLowerCase().indexOf(this.filter) >= 0;
  }

  /** While filtering every remaining group is open, otherwise the active step —
   *  or the first one when the active step has no shortcuts of its own. */
  expanded(group: ShortcutGroup, index: number): boolean {
    if (this.filter) { return true; }
    return this.groups.some(g => g.current) ? group.current : index === 0;
  }

  /** The keys are stored as html entities (see the symbol table of the service). */
  htmlDecode(input: string): string {
    const e = document.createElement('textarea');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
  }

  /** '⌃ + S' renders as two separate key caps. */
  keyCaps(keys: string): string[] {
    return this.htmlDecode(keys).split('+').map(k => k.trim()).filter(k => k.length > 0);
  }
}
