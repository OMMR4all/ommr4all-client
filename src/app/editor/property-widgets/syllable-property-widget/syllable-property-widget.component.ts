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

@Component({
  selector: 'app-syllable-property-widget',
  templateUrl: './syllable-property-widget.component.html',
  styleUrls: ['./syllable-property-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyllablePropertyWidgetComponent implements OnInit, DoCheck {
  private _prevSyllable = new Syllable();
  @Input() syllable: Syllable = null;
  @Input() selectedSyllableConnection: SyllableConnector = null;
  @Input() page: Page;
  @Output() syllableChanged = new EventEmitter();
  @Output() syllableClicked = new EventEmitter<SyllableClickEvent>();

  @ViewChild('textInput') textElem: ElementRef;

  get text() { return this.syllable.text; }
  set text(t: string) {
    if (this.text !== t) {
      this.actions.startAction(ActionType.LyricsEdit, [this.syllable]);
      this.actions.run(new CommandChangeProperty(this.syllable, 'text', this.syllable.text, t));
      this.actions.finishAction();
      this.syllableChanged.emit();
    }
  }

  get showVisibleDash() { return this.syllable.connection !== SyllableConnectionType.New; }
  get visibleDash() { return this.syllable.connection === SyllableConnectionType.Visible; }
  set visibleDash(b: boolean) {
    if (this.showVisibleDash) {
      this.actions.startAction(ActionType.LyricsEdit, [this.syllable]);
      this.actions.run(new CommandChangeProperty(this.syllable, 'connection', this.syllable.connection,
        b ? SyllableConnectionType.Visible : SyllableConnectionType.Hidden,
      ));
      this.actions.finishAction();
      this.syllableChanged.emit();
    }
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

  textChanged() {
    this.text = this.textElem.nativeElement.value.replace(/[ \-~]/, '');
    this.textElem.nativeElement.value = this.text;
    this.changeDetector.markForCheck();
  }
}
