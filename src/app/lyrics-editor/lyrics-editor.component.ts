import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {LyricsContainer, LyricsSyllable} from '../musical-symbols/lyrics';
import {RectEditorComponent} from '../rect-editor/rect-editor.component';
import { LyricsEditorService } from './lyrics-editor.service';
import {SyllableConnectionType} from '../data-types/page/definitions';
import {Symbol} from '../data-types/page/music-region/symbol';
import {StaffEquiv} from '../data-types/page/music-region/staff-equiv';

const machina: any = require('machina');

@Component({
  selector: '[app-lyrics-editor]',  // tslint:disable-line component-selector
  templateUrl: './lyrics-editor.component.html',
  styleUrls: ['./lyrics-editor.component.css'],
})
export class LyricsEditorComponent implements OnInit {
  SyllableConnectionType = SyllableConnectionType;

  @ViewChild('lyricsRoot') lyricsRootElement: ElementRef;
  @ViewChild(RectEditorComponent) rectEditor: RectEditorComponent;
  states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {
        _onEnter: () => {
          this.currentSyllable = null;
          this.staff = null;
          if (this.rectEditor) {
            this.rectEditor.states.transition('idle');
          }
        },
        select: 'selected'
      },
      selected: {
        idle: 'idle',
      },
    }
  });

  staff: StaffEquiv;
  currentSyllable: LyricsSyllable;

  constructor(private lyricsEditorService: LyricsEditorService) {
    this.lyricsEditorService.states = this.states;
  }

  ngOnInit() {
  }

  onMouseDown(event: MouseEvent) {
    if (this.states.state === 'selected') {
      this.states.handle('idle');
    } else if (this.states.state === 'idle') {
      this.rectEditor.onMouseDown(event);
    }

  }

  onMouseUp(event: MouseEvent) {
    if (this.states.state === 'idle') {
      this.rectEditor.onMouseUp(event);
    }

  }

  onMouseMove(event: MouseEvent) {
    this.rectEditor.onMouseMove(event);
  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (this.states.state === 'selected') {
      /* const syllable = this.staff.lyricsContainer.syllables.find((s: LyricsSyllable): boolean => s.note === symbol);
      if (syllable) {
        event.stopPropagation();
      } */
    }

  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    if (this.states.state === 'selected') {
      /* const syllable = this.staff.lyricsContainer.syllables.find((s: LyricsSyllable): boolean => s.note === symbol);
      if (syllable) {
        this.focusSyllable(syllable);
        event.stopPropagation();
      } */
    }
  }

  onLyricsContainerMouseDown(event: MouseEvent, container: LyricsContainer) {
    event.stopPropagation();
  }

  onLyricsContainerMouseUp(event: MouseEvent, container: LyricsContainer) {
    if (this.states.state === 'idle') {
      this.states.handle('select');
    }
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

  onFocusSyllable(event: MouseEvent, syllable: LyricsSyllable) {
    event.stopPropagation();
    event.preventDefault();
    this.focusSyllable(syllable);
  }

  onSyllableMouseDown(event: MouseEvent) {
    event.stopPropagation();
  }

  focusSyllable(syllable: LyricsSyllable, carretPos = 0) {
    if (syllable === null) {
      return;
    }
    if (this.currentSyllable !== syllable) {
      this.currentSyllable = syllable;

      // get this input field...
      const input = this.inputOfSyllable(syllable);
      input.focus();
      if (carretPos < 0) {
        carretPos = input.value.length;
      }
      input.selectionStart = input.selectionEnd = carretPos;
    }
  }

  inputOfSyllable(syllable: LyricsSyllable) {
    if (!syllable) { return null; }
    /* const idx = this.staff.lyricsContainer.syllables.indexOf(syllable);
    const staff = this.lyricsRootElement.nativeElement.children[0].children[1].children[idx];
    return staff.children[1].children[0].children[0].children[0]; */
  }

  onKeyDown(event: KeyboardEvent, syllable: LyricsSyllable) {
    if (event.code === 'Minus') {
      event.preventDefault();
      this.currentSyllable.connection = SyllableConnectionType.Hidden;
      // this.focusSyllable(this.staff.lyricsContainer.nextSyllable(this.currentSyllable), 0);
    } else if (event.code === 'Space') {
      this.currentSyllable.connection = SyllableConnectionType.New;
      event.preventDefault();
      // this.focusSyllable(this.staff.lyricsContainer.nextSyllable(this.currentSyllable), 0);
    } else if (event.code === 'Tab') {
      event.preventDefault();
      // this.focusSyllable(this.staff.lyricsContainer.nextSyllable(this.currentSyllable), 0);
    } else if (event.code === 'Backspace') {
      const input = this.inputOfSyllable(syllable);
      const cursor = input.selectionStart;
      if (cursor === 0) {
        event.preventDefault();
        // this.focusSyllable(this.staff.lyricsContainer.prevSyllable(syllable), -1);
      }
    } else if (event.code === 'ArrowLeft') {
      const input = this.inputOfSyllable(syllable);
      const cursor = input.selectionStart;
      if (cursor === 0) {
        event.preventDefault();
        // this.focusSyllable(this.staff.lyricsContainer.prevSyllable(syllable), -1);
      }
    } else if (event.code === 'ArrowRight') {
      const input = this.inputOfSyllable(syllable);
      const cursor = input.selectionStart;
      if (cursor === input.value.length) {
        event.preventDefault();
        // this.focusSyllable(this.staff.lyricsContainer.nextSyllable(syllable), 0);
      }
    }
  }
}
