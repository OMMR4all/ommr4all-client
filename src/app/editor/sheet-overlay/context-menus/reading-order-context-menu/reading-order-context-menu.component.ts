import {Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {Block} from '../../../../data-types/page/block';
import {MatMenu, MatMenuTrigger} from '@angular/material';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';

@Component({
  selector: 'app-reading-order-context-menu',
  templateUrl: './reading-order-context-menu.component.html',
  styleUrls: ['./reading-order-context-menu.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ReadingOrderContextMenuComponent implements OnInit {
  block: Block;
  x: number;
  y: number;
  @Output() autoCompute = new EventEmitter<Block>();

  @ViewChild(MatMenu) matMenu: MatMenu;
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;

  constructor(
    private actions: ActionsService,
  ) {
  }

  ngOnInit() {
    this.autoCompute.subscribe(block => {
      this.actions.startAction(ActionType.ReadingOrderAuto);
      this.actions.computeReadingOrder(block);
      this.actions.finishAction();
    });
  }

  open(x: number, y: number, block: Block) {
    this.x = x;
    this.y = y;
    this.block = block;
    this.matMenuTrigger.openMenu();
    const ele = document.getElementsByClassName('reading-order-context-menu').item(0) as HTMLElement;
    ele.style.top = this.y.toString() + 'px';
    ele.style.left = this.x.toString() + 'px';
    ele.style.display = 'block';
  }
}
