import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren
} from '@angular/core';
import {Block} from '../../../../data-types/page/block';
import {PageLine} from '../../../../data-types/page/pageLine';
import {BlockType, BlockTypeUtil} from '../../../../data-types/page/definitions';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {StaffLine} from '../../../../data-types/page/music-region/staff-line';
import {EditorTool} from '../../editor-tools/editor-tool';
import {LineViewComponent} from '../line-view/line-view.component';

@Component({
  selector: '[app-block-view]',  // tslint:disable-line component-selector
  templateUrl: './block-view.component.html',
  styleUrls: ['./block-view.component.css']
})
export class BlockViewComponent implements OnInit, OnChanges {
  BlockType = BlockType;
  BlockTypeUtil = BlockTypeUtil;

  @Input() block: Block;
  @Input() editorTool: EditorTool;

  @Output() lineMouseDown = new EventEmitter<{mouseEvent: MouseEvent, line: PageLine}>();
  @Output() lineMouseUp = new EventEmitter<{mouseEvent: MouseEvent, line: PageLine}>();
  @Output() lineMouseMove = new EventEmitter<{mouseEvent: MouseEvent, line: PageLine}>();
  @Output() lineContextMenu = new EventEmitter<{mouseEvent: MouseEvent, line: PageLine}>();

  @ViewChildren(LineViewComponent) lineViews: QueryList<LineViewComponent>;

  constructor(
    public sheetOverlayService: SheetOverlayService,
    public changeDetector: ChangeDetectorRef,
  ) {
    this.changeDetector.detach();
  }

  ngOnInit() {
    this.changeDetector.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.changeDetector.detectChanges();
  }

}
