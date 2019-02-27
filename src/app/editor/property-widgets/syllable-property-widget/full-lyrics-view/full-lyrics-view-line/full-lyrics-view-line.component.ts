import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Block} from '../../../../../data-types/page/block';
import {Annotations, NeumeConnector, SyllableConnector} from '../../../../../data-types/page/annotations';
import {PageLine} from '../../../../../data-types/page/pageLine';
import {Syllable} from '../../../../../data-types/page/syllable';
import {Subscription} from 'rxjs';
import {ViewChangesService} from '../../../../actions/view-changes.service';
import {ChangedView} from '../../../../actions/changed-view-elements';
import {filter} from 'rxjs/operators';

export class SyllableClickEvent {
  constructor(
    public syllable: Syllable,
    public connector: SyllableConnector,
  ) {}
}

@Component({
  selector: 'app-full-lyrics-view-line',
  templateUrl: './full-lyrics-view-line.component.html',
  styleUrls: ['./full-lyrics-view-line.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullLyricsViewLineComponent implements OnInit, OnDestroy {
  private _subscriptions = new Subscription();
  private _line: PageLine;
  @Input() set line(pageLine: PageLine) {
    if (this._line !== pageLine) {
      this._line = pageLine;
      this.changeDetector.markForCheck();
    }
  }
  get line() { return this._line; }

  @Input() annotations: Annotations;
  @Input() selectedNeumeConnection: NeumeConnector = null;
  @Output() syllableClicked = new EventEmitter<SyllableClickEvent>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private viewChanges: ViewChangesService,
  ) { }

  ngOnInit() {
    this._subscriptions.add(this.viewChanges.changed.pipe(
      filter((cv: ChangedView) => {
        if (cv.checkChangesLine.has(this._line)) { return true; }
        for (const w of this._line.sentence.words) {
          for (const s of w.syllables) {
            if (cv.checkChangesSyllables.has(s)) { return true; }
          }
        }
        return false;
      } )
    ).subscribe(
      (cv: ChangedView) => this.changeDetector.markForCheck()
    ));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  getConnector(line: PageLine, syllable: Syllable) {
    return this.annotations.findSyllableConnector(line, syllable);
  }

}
