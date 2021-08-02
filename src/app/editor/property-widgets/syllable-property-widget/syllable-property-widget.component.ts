import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Syllable} from '../../../data-types/page/syllable';
import {BlockType, SyllableConnectionType} from '../../../data-types/page/definitions';
import {Page} from '../../../data-types/page/page';
import {SyllableClickEvent} from './full-lyrics-view/full-lyrics-view-line/full-lyrics-view-line.component';
import {ViewChangesService} from '../../actions/view-changes.service';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';
import {CommandChangeProperty} from '../../undo/util-commands';
import {SyllableConnector} from '../../../data-types/page/annotations';
import {Sentence} from '../../../data-types/page/sentence';

@Component({
  selector: 'app-syllable-property-widget',
  templateUrl: './syllable-property-widget.component.html',
  styleUrls: ['./syllable-property-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyllablePropertyWidgetComponent implements OnInit, DoCheck {
  SCT = SyllableConnectionType;
  private _prevSyllable = new Syllable();
  @Input() syllable: Syllable = null;
  @Input() selectedSyllableConnection: SyllableConnector = null;
  @Input() page: Page;
  @Output() syllableChanged = new EventEmitter();
  @Output() syllableClicked = new EventEmitter<SyllableClickEvent>();

  @ViewChild('textInput') textElem: ElementRef;

  getPrevPageLine() {
    const pageLine = this.page.readingOrder.readingOrder.filter(pl => pl.sentence.hasSyllable(this.syllable))[0];
    if (!pageLine) { return false; }  // must not happen
    return this.page.readingOrder.readingOrder[this.page.readingOrder.readingOrder.indexOf(pageLine) - 1];
  }

  hasDropCapital() {
    if (this.syllable.prefix.length > 0) { return true; }
    const pageLine = this.page.readingOrder.readingOrder.filter(pl => pl.sentence.syllables.indexOf(this.syllable) === 0)[0];
    if (!pageLine) { return false; }  // must not happen
    const prev = this.page.readingOrder.readingOrder[this.page.readingOrder.readingOrder.indexOf(pageLine) - 1];
    return prev && prev.blockType === BlockType.DropCapital;
  }

  get text() { return this.syllable.text; }
  set text(t: string) {
    if (this.text !== t) {
      this.actions.startAction(ActionType.LyricsEdit, [this.syllable]);
      this.actions.run(new CommandChangeProperty(this.syllable, 'text', this.syllable.text, t));
      this.actions.finishAction();
      this.syllableChanged.emit();
    }
  }

  get prefix() { return this.syllable.prefix; }
  set prefix(t: string) {
    if (this.prefix !== t) {
      const prev = this.getPrevPageLine();
      if (!prev || prev.blockType !== BlockType.DropCapital) { return; }
      this.actions.startAction(ActionType.LyricsEdit, [this.syllable]);
      this.actions.changeLyrics(prev, new Sentence([new Syllable(t)]));
      this.actions.run(new CommandChangeProperty(this.syllable, 'prefix', this.syllable.prefix, t));
      this.actions.finishAction();
      this.syllableChanged.emit();
    }
  }

  get syllableConnection() { return this.syllable.connection; }
  set syllableConnection(sct: SyllableConnectionType) {
    this.actions.startAction(ActionType.LyricsEdit, [this.syllable]);
    this.actions.run(new CommandChangeProperty(this.syllable, 'connection', this.syllable.connection, sct));
    this.actions.finishAction();
    this.syllableChanged.emit();
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private viewChanges: ViewChangesService,
    private actions: ActionsService,
  ) { }

  ngOnInit() {
  }

  ngDoCheck() {
    if (!this.syllable) {
      this._prevSyllable = new Syllable();
      this.changeDetector.markForCheck();
    } else if (!this._prevSyllable.equals(this.syllable)) {
      this._prevSyllable.copyFrom(this.syllable);
      this.changeDetector.markForCheck();
    }
  }

  get lyricLines() {
    if (!this.page) { return []; }
    return this.page.readingOrder.readingOrder.filter(p => p.blockType === BlockType.Lyrics);
  }

  textChanged(event: Event) {
    const elem = event.target as HTMLInputElement;
    elem.value = elem.value.replace(/[ \-~]/, '');
    this.changeDetector.markForCheck();
  }
}
