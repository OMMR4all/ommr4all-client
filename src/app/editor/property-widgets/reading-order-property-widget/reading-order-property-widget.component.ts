import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PageLine} from '../../../data-types/page/pageLine';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';
import {ViewChangesService} from '../../actions/view-changes.service';

@Component({
  selector: 'app-reading-order-property-widget',
  templateUrl: './reading-order-property-widget.component.html',
  styleUrls: ['./reading-order-property-widget.component.css']
})
export class ReadingOrderPropertyWidgetComponent implements OnInit {
  @Input() readingOrder: Array<PageLine> = null;
  @Output() selectedLineChanged = new EventEmitter<PageLine>();

  isDragging = false;

  constructor(
    private actions: ActionsService,
    private viewChange: ViewChangesService,
  ) { }

  ngOnInit() {
  }

  drop(event: CdkDragDrop<PageLine[]>) {
    this.actions.startAction(ActionType.ReadingOrderDrag)
    this.actions.moveItemInReadingOrder((event.item.data as PageLine).block.page, event.previousIndex, event.currentIndex);
    this.actions.finishAction();
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

}
