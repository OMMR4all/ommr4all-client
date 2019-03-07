import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {EditorTool} from '../../../editor-tools/editor-tool';
import {Point, PolyLine} from '../../../../../geometry/geometry';
import {SheetOverlayService} from '../../../sheet-overlay.service';
import {BlockType, BlockTypeUtil} from '../../../../../data-types/page/definitions';

@Component({
  selector: 'app-reading-order-view-overlay',
  templateUrl: './reading-order-view-overlay.component.html',
  styleUrls: ['./reading-order-view-overlay.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingOrderViewOverlayComponent implements OnInit {
  readonly BlockType = BlockType;
  readonly BlockTypeUtil = BlockTypeUtil;
  globalPos: PolyLine;
  private _readingOrderPoints: PolyLine;
  @Input() get readingOrderPoints() { return this._readingOrderPoints; }
  set readingOrderPoints(p: PolyLine) {
    this._readingOrderPoints = p;
    this._updatePoints();
  }
  @Input() editorTool: EditorTool;
  @Input() highlightedIndex = -1;
  @Input() type: BlockType;

  private _pan = 0;
  private _zoom = 1;
  @Input() get pan() { return this._pan; }
  @Input() get zoom() { return this._zoom; }
  set pan(p: number) {
    if (this._pan !== p) {
      this._pan = p;
      this._updatePoints();
    }
  }
  set zoom(z: number) {
    if (this._zoom !== z) {
      this._zoom = z;
      this._updatePoints();
    }
  }

  constructor(
    private sheetOverlay: SheetOverlayService,
    private changeDetector: ChangeDetectorRef,
  ) { }

  ngOnInit() {
  }

  private _updatePoints() {
    this.globalPos = new PolyLine(this.readingOrderPoints.points.map(p => this.sheetOverlay.localToGlobalPos(p)));
    this.changeDetector.markForCheck();
  }

  trackElement(index: number, element: Point) {
    return element ? element.x + ',' + element.y : null;
  }
}
