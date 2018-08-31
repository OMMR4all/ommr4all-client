import {Component, OnInit, ViewChild} from '@angular/core';
import { LyricsContainer } from '../musical-symbols/lyrics';
import {RectEditorComponent} from '../rect-editor/rect-editor.component';
const machina: any = require('machina');

@Component({
  selector: '[app-lyrics-editor]',
  templateUrl: './lyrics-editor.component.html',
  styleUrls: ['./lyrics-editor.component.css']
})
export class LyricsEditorComponent implements OnInit {
  @ViewChild(RectEditorComponent) rectEditor: RectEditorComponent;
  states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {

      }
    }
  });

  constructor() { }

  ngOnInit() {
  }

  onMouseDown(event: MouseEvent) {

  }

  onMouseUp(event: MouseEvent) {

  }

  onMouseMove(event: MouseEvent) {
    this.rectEditor.onMouseMove(event);
  }

  onLyricsContainerMouseDown(event: MouseEvent, container: LyricsContainer) {
  }

  onLyricsContainerMouseUp(event: MouseEvent, container: LyricsContainer) {
    this.rectEditor.states.handle('select');
    this.rectEditor.selectedRect = container.aabb;
  }

  onLyricsContainerMouseMove(event: MouseEvent, container: LyricsContainer) {
    this.rectEditor.onMouseMove(event);
  }
}
