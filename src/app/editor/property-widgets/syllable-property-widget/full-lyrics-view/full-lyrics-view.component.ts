import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {copyList} from '../../../../utils/copy';
import {Annotations, SyllableConnector} from '../../../../data-types/page/annotations';
import {SyllableClickEvent} from './full-lyrics-view-line/full-lyrics-view-line.component';
import {PageLine} from '../../../../data-types/page/pageLine';

@Component({
  selector: 'app-full-lyrics-view',
  templateUrl: './full-lyrics-view.component.html',
  styleUrls: ['./full-lyrics-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullLyricsViewComponent implements OnInit {
  private _lyricLines = new Array<PageLine>();
  @Input() set lyricLines(lines: PageLine[]) {
    if (this._lyricLines.length !== lines.length) {
      this._lyricLines = copyList(lines);
      this.changeDetector.markForCheck();
      return;
    }
    for (let i = 0; i < this._lyricLines.length; i++) {
      if (this._lyricLines[i] !== lines[i]) {
        this._lyricLines = copyList(lines);
        this.changeDetector.markForCheck();
        return;
      }
    }
  }
  get lyricLines() { return this._lyricLines; }

  @Input() annotations: Annotations;
  @Input() selectedSyllableConnection: SyllableConnector = null;
  @Output() syllableClicked = new EventEmitter<SyllableClickEvent>();


  constructor(
    private changeDetector: ChangeDetectorRef,
  ) { }

  ngOnInit() {
  }

}
