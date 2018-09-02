import {Component, EventEmitter, OnInit, ViewChild, Output, ElementRef} from '@angular/core';
import {LyricsContainer, LyricsSyllable} from '../musical-symbols/lyrics';
import { Staff } from '../musical-symbols/StaffLine';
import {RectEditorComponent} from '../rect-editor/rect-editor.component';
const machina: any = require('machina');

@Component({
  selector: '[app-lyrics-editor]',
  templateUrl: './lyrics-editor.component.html',
  styleUrls: ['./lyrics-editor.component.css'],
})
export class LyricsEditorComponent implements OnInit {
  @ViewChild('lyricsRoot') lyricsRootElement: ElementRef;
  @ViewChild(RectEditorComponent) rectEditor: RectEditorComponent;
  states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {

      },
    }
  });

  staff: Staff;
  currentSyllable: LyricsSyllable;

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
    this.staff = container.staff;
  }

  onLyricsContainerMouseMove(event: MouseEvent, container: LyricsContainer) {
    this.rectEditor.onMouseMove(event);
  }

  onInputChanged(event: Event, syllable: LyricsSyllable) {
    // syllable.text = event.srcElement['value'];
  }

  onSyllableFocusIn(event: Event, syllable: LyricsSyllable) {
    this.currentSyllable = syllable;
  }

  focusSyllable(syllable: LyricsSyllable) {
    if (this.currentSyllable !== syllable) {
      // get this input field...
      const idx = this.staff.lyricsContainer.syllables.indexOf(syllable);
      const staff = this.lyricsRootElement.nativeElement.children[0].children[idx];
      const input = staff.children[0].children[0].children[0].children[0];
      input.focus();

    }
  }

  onKeyDown(event: KeyboardEvent, syllable: LyricsSyllable) {
    if (event.code === 'Minus') {
      event.preventDefault();
    } else if (event.code === 'Space') {
      event.preventDefault();
      this.focusSyllable(this.staff.lyricsContainer.nextSyllable(this.currentSyllable));
    } else if (event.code === 'Tab') {
      event.preventDefault();
    }
  }
}
