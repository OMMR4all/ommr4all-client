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
import {SyllableConnectionType} from '../../../data-types/page/definitions';

@Component({
  selector: 'app-syllable-property-widget',
  templateUrl: './syllable-property-widget.component.html',
  styleUrls: ['./syllable-property-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyllablePropertyWidgetComponent implements OnInit, DoCheck {
  private _prevSyllable = new Syllable();
  @Input() syllable: Syllable = null;
  @Output() syllableChanged = new EventEmitter();

  @ViewChild('textInput') textElem: ElementRef;

  get text() { return this.syllable.text; }
  set text(t: string) { if (this.text !== t) { this.syllable.text = t; this.syllableChanged.emit(); } }

  get showVisibleDash() { return this.syllable.connection !== SyllableConnectionType.New; }
  get visibleDash() { return this.syllable.connection === SyllableConnectionType.Visible; }
  set visibleDash(b: boolean) {
    if (this.showVisibleDash) {
      this.syllable.connection = b ? SyllableConnectionType.Visible : SyllableConnectionType.Hidden;
      this.syllableChanged.emit();
    }
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
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

  textChanged() {
    this.text = this.textElem.nativeElement.value.replace(/[ \-~]/, '');
    this.textElem.nativeElement.value = this.text;
    this.changeDetector.markForCheck();
  }
}
