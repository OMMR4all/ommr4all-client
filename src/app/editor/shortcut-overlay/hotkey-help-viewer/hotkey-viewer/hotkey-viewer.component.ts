import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-hotkey-viewer',
  templateUrl: './hotkey-viewer.component.html',
  styleUrls: ['./hotkey-viewer.component.scss']
})
export class HotkeyViewerComponent implements OnInit {
  hotkeys = Array.from(this.data);

  constructor(@Inject(MAT_DIALOG_DATA) public data) { }

  ngOnInit() {
  }
  htmlDecode(input) {
    const e = document.createElement('textarea');
    e.innerHTML = input;
    // handle case of empty input
    return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
  }

}
