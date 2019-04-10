import {Component, Inject, OnInit} from '@angular/core';
import {StepperSelectionEvent} from '@angular/cdk/stepper';
import {Page} from '../../../data-types/page/page';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {ActionsService} from '../../actions/actions.service';
import {BlockType} from '../../../data-types/page/definitions';
import {PageLine} from '../../../data-types/page/pageLine';
import {ActionType} from '../../actions/action-types';
import {Sentence} from '../../../data-types/page/sentence';

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
    ;
  }

  selectionChanged(e: StepperSelectionEvent) {
    if (e.selectedIndex === 1) {
      this.initPreview();
    }
  }

  close() {
    this.dialogRef.close();
  }

  insert() {
    const textLines = this.data.page.readingOrder.readingOrder.filter(tl => tl.blockType === BlockType.Lyrics);
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
    for (let i = 0; i < startLines.length && i < lineTexts.length; i++) {
      this.actions.changeLyrics(startLines[i], new Sentence(Sentence.textToSyllables(lineTexts[i])));
    }

    this.actions.automaticSyllableAssign(this.data.page);


    this.actions.finishAction();
    this.close();
  }
}
