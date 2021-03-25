import {Component, Inject, OnInit} from '@angular/core';
import {StepperSelectionEvent} from '@angular/cdk/stepper';
import {Page} from '../../../data-types/page/page';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ActionsService} from '../../actions/actions.service';
import {BlockType} from '../../../data-types/page/definitions';
import {PageLine} from '../../../data-types/page/pageLine';
import {ActionType} from '../../actions/action-types';
import {Sentence} from '../../../data-types/page/sentence';
import {Syllable} from '../../../data-types/page/syllable';

export class LyricsPasteToolData {
  page: Page;
}

@Component({
  selector: 'app-lyrics-paste-tool-dialog',
  templateUrl: './lyrics-paste-tool-dialog.component.html',
  styleUrls: ['./lyrics-paste-tool-dialog.component.css']
})
export class LyricsPasteToolDialogComponent implements OnInit {
  rawText = '';
  preformattedText = '';

  constructor(
    public actions: ActionsService,
    private dialogRef: MatDialogRef<LyricsPasteToolDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LyricsPasteToolData,
  ) {
  }

  ngOnInit() {
    if (!this.data.page) { close(); }
  }

  private initPreview() {
    this.preformattedText = this.rawText
      .replace(/\n+/gi, ' ')
      .replace(/[\s]+/gi, ' ')
      .replace(/\s*\|\|\s*/gi, '')
      .replace(/\s*\|\s*/gi, '\n')
      .replace(/-\n/gi, '\n-')
      .replace(/\s*\/\s*/gi, '/')
      .replace(/\s*!\s*/gi, '!')
    ;
  }

  selectionChanged(e: StepperSelectionEvent) {
    if (e.selectedIndex === 1) {
      this.initPreview();
    }
  }

  close(r: any = false) {
    this.dialogRef.close(r);
  }

  _insert() {
    const readingOrder = this.data.page.readingOrder.readingOrder;
    const textLines = readingOrder.filter(tl => tl.blockType === BlockType.Lyrics);
    if (textLines.length === 0) { return; }

    this.actions.startAction(ActionType.LyricsEdit);

    const startLines = new Array<PageLine>(textLines[0]);
    let endX = startLines[0].AABB.right;
    for (let i = 1; i < textLines.length; i++) {
      if (textLines[i].AABB.left < endX) {
        startLines.push(textLines[i]);
        endX = textLines[i].AABB.right;
      }
    }
    const lineTexts = this.preformattedText.split('\n');

    const nextValidLine = (line) => {
      const idx = textLines.indexOf(line);
      const nextLine = textLines[idx + 1];
      if (nextLine && startLines.indexOf(nextLine) < 0) {
        return textLines[idx + 1];
      } else {
        return line;
      }
    };

    for (let i = 0; i < startLines.length && i < lineTexts.length; i++) {
      const textParts = lineTexts[i].split('/');
      let line = startLines[i];
      textParts.forEach(textPart => {
        if (textPart.startsWith('!') && textPart.length > 1) {
          // check if previous line component is a drop capital, then add this as letter
          const prev = readingOrder[readingOrder.indexOf(line) - 1];
          if (prev && prev.blockType === BlockType.DropCapital) {
            this.actions.changeLyrics(prev, new Sentence([new Syllable(textPart[1])]));
            textPart = textPart.substr(2);
          }
        }
        this.actions.changeLyrics(line, new Sentence([...line.sentence.syllables, ...Sentence.textToSyllables(textPart)]));
        line = nextValidLine(line);
      });
    }

    this.actions.updateSyllablePrefix(this.data.page);

    this.actions.finishAction();
  }

  insert() {
    this._insert();
    this.close({assignSyllables: false});
  }

  insertAndAssign() {
    this._insert();
    this.close({assignSyllables: true});
  }
}
