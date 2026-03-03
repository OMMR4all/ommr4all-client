import { Component, OnInit, inject } from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-hotkey-viewer',
    templateUrl: './hotkey-viewer.component.html',
    styleUrls: ['./hotkey-viewer.component.scss'],
    standalone: false
})
export class HotkeyViewerComponent implements OnInit {
  data = inject(MAT_DIALOG_DATA);

  hotkeys = Array.from(this.data);

  ngOnInit() {
  }
  htmlDecode(input) {
    const e = document.createElement('textarea');
    e.innerHTML = input;
    // handle case of empty input
    return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
  }

}
