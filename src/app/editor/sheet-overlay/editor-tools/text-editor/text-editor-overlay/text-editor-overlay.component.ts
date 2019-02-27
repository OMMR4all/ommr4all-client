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
import {ActionType} from '../../../../actions/action-types';
import {BlockType} from '../../../../../data-types/page/definitions';
import {Sentence} from '../../../../../data-types/page/word';
import {Point} from '../../../../../geometry/geometry';
import {PageLine} from '../../../../../data-types/page/pageLine';
import {Subscription} from 'rxjs';
import {ViewChangesService} from '../../../../actions/view-changes.service';
import {ReadingOrderContextMenuComponent} from '../../../context-menus/reading-order-context-menu/reading-order-context-menu.component';

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
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }


  ngAfterContentChecked() {
    if (this.inputText) {
      this.inputText.nativeElement.focus();
    }
  }

  changeSyllables(to: string): void {
    const newSentence = new Sentence(Sentence.textToWordsAndSyllables(to));
    this.actions.changeLyrics(this._line, newSentence);
  }

}
