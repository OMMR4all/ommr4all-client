import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, Renderer2, ViewChild} from '@angular/core';
import {Block} from '../../../../data-types/page/block';
import {MatMenu, MatMenuTrigger} from '@angular/material';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {BlockType} from '../../../../data-types/page/definitions';

@Component({
  selector: 'app-reading-order-context-menu',
  templateUrl: './reading-order-context-menu.component.html',
  styleUrls: ['./reading-order-context-menu.component.css'],
})
export class ReadingOrderContextMenuComponent implements OnInit, OnDestroy {
  block: Block;
  musicblock: Block;
  @Output() autoCompute = new EventEmitter<Block>();
  // Start of a document/song
  @Output() documentStart = new EventEmitter<Block>();
  @ViewChild(MatMenu, {static: false}) matMenu: MatMenu;
  @ViewChild(MatMenuTrigger, {static: false}) matMenuTrigger: MatMenuTrigger;
  @ViewChild('menuTriggerElement', {static: false}) matMenuTriggerEle: ElementRef;

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
    (block.type === BlockType.Lyrics) ? this.musicblock = block : this.musicblock = null;
    const ele = this.matMenuTriggerEle.nativeElement;
    this.renderer.setStyle(ele, 'left', x.toString() + 'px');
    this.renderer.setStyle(ele, 'top', y.toString() + 'px');
    this.matMenuTrigger.openMenu();
  }

  ngOnDestroy(): void {
  }
}
