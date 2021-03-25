import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {SheetOverlayService} from '../../../sheet-overlay.service';
import {ActionsService} from '../../../../actions/actions.service';
import {BlockType} from '../../../../../data-types/page/definitions';
import {Sentence} from '../../../../../data-types/page/sentence';
import {PageLine} from '../../../../../data-types/page/pageLine';
import {Subscription} from 'rxjs';
import {ViewChangesService} from '../../../../actions/view-changes.service';
import {BookPermissionFlag} from '../../../../../data-types/permissions';

@Component({
  selector: 'app-text-editor-overlay',
  templateUrl: './text-editor-overlay.component.html',
  styleUrls: ['./text-editor-overlay.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorOverlayComponent implements OnInit, OnDestroy, AfterContentChecked {
  private _subscription = new Subscription();
  private _line: PageLine = null;
  @Input() set line(l: PageLine) {
    if (l === this._line) { return; }
    this._line = l;
  }
  get line() { return this._line; }
  @Input() zoom = 1;
  @Input() pan = {x: 0, y: 0};
  @Input() viewWidth = 0;

  get sentence() { return this._line.sentence; }
  get aabb() { return this._line.AABB; }
  get blockType() { return this._line.getBlock().type; }

  @ViewChild('input') inputText: ElementRef;
  Mode = BlockType;

  get top() { return Math.max(0, this.aabb.bottom * this.zoom + this.pan.y); }
  get left() { return Math.max(0, this.aabb.left * this.zoom + this.pan.x); }
  get right() { return Math.min(this.viewWidth, this.aabb.right * this.zoom + this.pan.x); }
  get width() { return this.right - this.left; }

  get currentText() {
    return this.sentence.text;
  }

  set currentText(text: string) {
    if (this.currentText === text) { return; }
    this.changeSyllables(text);
  }

  get virtualKeyboardStoringPermitted() { return this.sheetOverlayService.editorService.bookMeta.hasPermission(BookPermissionFlag.Write); }

  constructor(
    public sheetOverlayService: SheetOverlayService,
    public actions: ActionsService,
    private viewChanges: ViewChangesService,
    private changeDetector: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this._subscription.add(this.viewChanges.changed.subscribe((vc) => {
      if (vc.checkChangesLine.has(this._line)) {
        this.changeDetector.markForCheck();
      }
    }));
    if (this.inputText) {
      this.inputText.nativeElement.focus();
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }


  ngAfterContentChecked() {
  }

  get virtualKeyboardUrl() { return this.sheetOverlayService.editorService.bookCom.virtualKeyboardUrl(); }

  changeSyllables(to: string): void {
    const newSentence = new Sentence(Sentence.textToSyllables(to));
    this.actions.changeLyrics(this._line, newSentence);
  }

  insertAtCaret(text: string) {
    const input = this.inputText.nativeElement as HTMLInputElement;
    const scrollPos = input.scrollTop;
    let caretPos = input.selectionStart;

    const front = (input.value).substring(0, caretPos);
    const back = (input.value).substring(input.selectionEnd, input.value.length);
    const value = front + text + back;
    caretPos = caretPos + text.length;
    this.currentText = value;
    this.changeDetector.markForCheck();
    input.selectionStart = caretPos;
    input.selectionEnd = caretPos;
    input.scrollTop = scrollPos;
  }
}
