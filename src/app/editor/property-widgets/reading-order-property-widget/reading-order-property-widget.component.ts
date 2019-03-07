import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PageLine} from '../../../data-types/page/pageLine';
import {CdkDragDrop, CdkDragSortEvent, moveItemInArray} from '@angular/cdk/drag-drop';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';
import {ViewChangesService} from '../../actions/view-changes.service';
import {copyFromList, copyList} from '../../../utils/copy';
import {Page} from '../../../data-types/page/page';
import {BlockType, BlockTypeUtil} from '../../../data-types/page/definitions';
import {SheetOverlayService} from '../../sheet-overlay/sheet-overlay.service';

@Component({
  selector: 'app-reading-order-property-widget',
  templateUrl: './reading-order-property-widget.component.html',
  styleUrls: ['./reading-order-property-widget.component.css']
})
export class ReadingOrderPropertyWidgetComponent implements OnInit {
  readonly BlockType = BlockType;
  readonly BlockTypeUtil = BlockTypeUtil;

  private _readingOrder: Array<PageLine> = null;
  @Input() get readingOrder() { return this._readingOrder; }
  set readingOrder(r: Array<PageLine>) {
    this._readingOrder = r;
    if (!this.isDragging) {
      this._initialReadingOrder = copyList(this._readingOrder);
    }
  }

  @Input() page: Page = null;


  private _initialReadingOrder: Array<PageLine> = null;
  get initialReadingOrder() { return this._initialReadingOrder; }

  @Output() selectedLineChanged = new EventEmitter<PageLine>();

  isDragging = false;

  constructor(
    private actions: ActionsService,
    private viewChange: ViewChangesService,
    private changeDetector: ChangeDetectorRef,
    public sheetOverlay: SheetOverlayService,
  ) { }

  ngOnInit() {
  }

  drop(event: CdkDragDrop<PageLine[]>) {
    this.actions.startAction(ActionType.ReadingOrderDrag);
    if (this._initialReadingOrder) {
      copyFromList(this.readingOrder, this._initialReadingOrder);
    }

    this.actions.moveItemInReadingOrder(this.page, event.previousIndex, event.currentIndex);
    this.actions.finishAction();
    this._initialReadingOrder = copyList(this._readingOrder);
  }

  onSorted(event: CdkDragSortEvent<PageLine[]>) {
    moveItemInArray(this.readingOrder, event.previousIndex, event.currentIndex);
    this.page.readingOrder._readingOrderChanged();
    this.viewChange.request([this.page]);
    this.changeDetector.markForCheck();
  }

  onEnterLine(line: PageLine) {
    if (this.isDragging) { return; }
    this.selectedLineChanged.emit(line);
    this.viewChange.request([line]);
  }

  onLeaveLine(line: PageLine) {
    if (this.isDragging) { return; }
    this.selectedLineChanged.emit(null);
    this.viewChange.request([line]);
  }

  onDragStarted(line: PageLine) {
    this.onEnterLine(line);
    this.isDragging = true;
  }
}
