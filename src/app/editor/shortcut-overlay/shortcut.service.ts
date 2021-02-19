import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {EventManager} from '@angular/platform-browser';
import {Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {HotkeyViewerComponent} from './hotkey-help-viewer/hotkey-viewer/hotkey-viewer.component';
import {EditorTools} from '../tool-bar/tool-bar-state.service';

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

@Injectable({
  providedIn: 'root'
})
export class ShortcutService {
  hotkeys = new Map();
  defaults: Partial<Options> = {
    element: this.document
};

  constructor(private eventManager: EventManager, private dialog: MatDialog, @Inject(DOCUMENT) private document: Document) {
    this.addShortcut({ keys: 'shift.?' }).subscribe(() => {
      this.openHelpModal();
  });
  }
  symbols() {
    return _symbols;
  }
  addShortcut(options: Partial<Options>) {
    const merged = { ...this.defaults, ...options};
    const event = `keydown.${merged.keys}`;

    merged.description && this.hotkeys.set(merged.keys, merged.description);

    return new Observable(observer => {
      const handler = (e) => {
        e.preventDefault();
        observer.next(e);
      };

      const dispose = this.eventManager.addEventListener(
        merged.element, event, handler
      );

      return () => {
        dispose();
        this.hotkeys.delete(merged.keys);
      };
    });
  }
  deleteShortcut(options: Partial<Options>) {
    const merged = { ...this.defaults, ...options};
    const event = `keydown.${merged.keys}`;
    this.hotkeys.delete(merged.keys);
  }

  openHelpModal() {
    this.dialog.open(HotkeyViewerComponent, {
      width: '500px',
      data: this.hotkeys
    });
  }
}
