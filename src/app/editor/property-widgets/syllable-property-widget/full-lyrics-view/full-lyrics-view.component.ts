import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {copyList} from '../../../../utils/copy';
import {Block} from '../../../../data-types/page/block';
import {Annotations} from '../../../../data-types/page/annotations';
import {Syllable} from '../../../../data-types/page/syllable';
import {SyllableClickEvent} from './full-lyrics-view-line/full-lyrics-view-line.component';

@Component({
  selector: 'app-full-lyrics-view',
  templateUrl: './full-lyrics-view.component.html',
  styleUrls: ['./full-lyrics-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullLyricsViewComponent implements OnInit {
  private _blocks = new Array<Block>();
  @Input() set lyricBlocks(blocks: Block[]) {
    if (this._blocks.length !== blocks.length) {
      this._blocks = copyList(blocks);
      this.changeDetector.markForCheck();
      return;
    }
    for (let i = 0; i < this._blocks.length; i++) {
      if (this._blocks[i] !== blocks[i]) {
        this._blocks = copyList(blocks);
        this.changeDetector.markForCheck();
        return;
      }
    }
  }
  get lyricBlocks() { return this._blocks; }

  @Input() annotations: Annotations;
  @Output() syllableClicked = new EventEmitter<SyllableClickEvent>();


  constructor(
    private changeDetector: ChangeDetectorRef,
  ) { }

  ngOnInit() {
  }

}
