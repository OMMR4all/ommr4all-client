import {ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {EditorTool} from '../../editor-tools/editor-tool';
import {PolyLine} from '../../../../geometry/geometry';
import {BlockType, BlockTypeUtil} from '../../../../data-types/page/definitions';

@Component({
  selector: '[app-reading-order-view]',  // tslint:disable-line component-selector
  templateUrl: './reading-order-view.component.html',
  styleUrls: ['./reading-order-view.component.css']
})
export class ReadingOrderViewComponent implements OnInit, OnChanges {
  readonly BlockTypeUtil = BlockTypeUtil;
  readonly BlockType = BlockType;
  @Input() readingOrderPoints: PolyLine;
  @Input() editorTool: EditorTool;
  @Input() type: BlockType;

  constructor(
    private changeDetector: ChangeDetectorRef,
  ) {
    changeDetector.detach();
  }

  ngOnInit() {
    this.redraw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.redraw();
  }

  redraw() {
    this.changeDetector.detectChanges();
  }


}
