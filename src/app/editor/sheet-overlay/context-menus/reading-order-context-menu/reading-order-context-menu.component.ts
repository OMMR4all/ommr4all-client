import {Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild, ViewEncapsulation} from '@angular/core';
import {Block} from '../../../../data-types/page/block';
import {MatMenu, MatMenuTrigger} from '@angular/material';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';

@Component({
  selector: 'app-reading-order-context-menu',
  templateUrl: './reading-order-context-menu.component.html',
  styleUrls: ['./reading-order-context-menu.component.css'],
})
export class ReadingOrderContextMenuComponent implements OnInit {
  block: Block;
  @Output() autoCompute = new EventEmitter<Block>();

  @ViewChild(MatMenu) matMenu: MatMenu;
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;
  @ViewChild('menuTriggerElement') matMenuTriggerEle: ElementRef;

  constructor(
    private actions: ActionsService,
    private renderer: Renderer2,
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
    this.block = block;
    const ele = this.matMenuTriggerEle.nativeElement;
    this.renderer.setStyle(ele, 'left', x.toString() + 'px');
    this.renderer.setStyle(ele, 'top', y.toString() + 'px');
    this.matMenuTrigger.openMenu();
  }
}
