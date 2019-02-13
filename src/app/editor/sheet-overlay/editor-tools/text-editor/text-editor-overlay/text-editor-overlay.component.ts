import {AfterContentChecked, ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {SheetOverlayService} from '../../../sheet-overlay.service';
import {ActionsService} from '../../../../actions/actions.service';
import {ActionType} from '../../../../actions/action-types';
import {BlockType} from '../../../../../data-types/page/definitions';
import {Sentence} from '../../../../../data-types/page/word';
import {Point} from '../../../../../geometry/geometry';
import {PageLine} from '../../../../../data-types/page/pageLine';

@Component({
  selector: 'app-text-editor-overlay',
  templateUrl: './text-editor-overlay.component.html',
  styleUrls: ['./text-editor-overlay.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorOverlayComponent implements OnInit, AfterContentChecked {
  private _line: PageLine = null;
  @Input() set line(l: PageLine) {
    if (l === this._line) { return; }
    this._line = l;
    this._currentText = l.sentence.text;
  }
  get line() { return this._line; }
  @Input() zoom = 1;
  @Input() pan = {x: 0, y: 0};
  @Input() viewWidth = 0;

  get sentence() { return this._line.sentence; }
  get aabb() { return this._line.AABB; }
  get blockType() { return this._line.getBlock().type; }

  private _currentText = '';
  @ViewChild('input') inputText: ElementRef;
  Mode = BlockType;

  get top() { return Math.max(0, this.aabb.bottom * this.zoom + this.pan.y); }
  get left() { return Math.max(0, this.aabb.left * this.zoom + this.pan.x); }
  get right() { return Math.min(this.viewWidth, this.aabb.right * this.zoom + this.pan.x); }
  get width() { return this.right - this.left; }

  get currentText() {
    return this._currentText;
  }

  set currentText(text: string) {
    if (this._currentText === text) { return; }
    const r = this.changeSyllables(this._currentText, text);
    const anno = this._line.getBlock().page.annotations;
    this.actions.startAction(ActionType.LyricsEdit);
    r.deleted.forEach(syllable => this.actions.connectionRemoveSyllableConnector(anno.findSyllableConnector(this._line, syllable)));
    this.actions.finishAction();
    /* const te = this.textEditorService.currentTextEquiv;
    this.actions.startAction(ActionType.LyricsEdit);
    this.actions.run(new CommandChangeProperty(te, 'content', te.content, text));
    this.actions.finishAction(); */
    this._currentText = this.sentence.text;
  }

  constructor(
    public sheetOverlayService: SheetOverlayService,
    public actions: ActionsService,
  ) { }

  ngOnInit() {
  }

  ngAfterContentChecked() {
    if (this.inputText) {
      this.inputText.nativeElement.focus();
    }
  }

  changeSyllables(from: string, to: string) {
    const newSentence = new Sentence(Sentence.textToWordsAndSyllables(to));
    return this.sentence.merge(newSentence);
  }

}
