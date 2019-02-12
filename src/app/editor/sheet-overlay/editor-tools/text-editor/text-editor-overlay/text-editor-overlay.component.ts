import {AfterContentChecked, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {TextEditorService} from '../text-editor.service';
import {SheetOverlayService} from '../../../sheet-overlay.service';
import {ActionsService} from '../../../../actions/actions.service';
import {CommandChangeProperty} from '../../../../undo/util-commands';
import {ActionType} from '../../../../actions/action-types';
import {BlockType} from '../../../../../data-types/page/definitions';
import {Sentence} from '../../../../../data-types/page/word';
import {Rect} from '../../../../../geometry/geometry';
import {PageLine} from '../../../../../data-types/page/pageLine';

@Component({
  selector: 'app-text-editor-overlay',
  templateUrl: './text-editor-overlay.component.html',
  styleUrls: ['./text-editor-overlay.component.css']
})
export class TextEditorOverlayComponent implements OnInit, AfterContentChecked {
  private _line: PageLine = null;
  @Input() set line(l: PageLine) {
    if (l === this._line) { return; }
    this._line = l;
    this._currentText = l.sentence.text;
  }
  get line() { return this._line; }

  get sentence() { return this._line.sentence; }
  get aabb() { return this._line.AABB; }
  get type() { return this._line.getBlock().type; }

  private _currentText = '';
  @ViewChild('input') inputText: ElementRef;
  Mode = BlockType;
  get position() {
    return this.sheetOverlayService.localToGlobalPosition(this.aabb.bl());
  }

  get width() {
    return this.sheetOverlayService.localToGlobalSize(this.aabb.size.w);
  }

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
