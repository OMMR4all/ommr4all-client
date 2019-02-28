import {Component, ElementRef, Input, OnInit, Output, Renderer2, ViewChild} from '@angular/core';
import {EventEmitter} from '@angular/core';
import {BlockType} from '../../../../data-types/page/definitions';
import {PageLine} from '../../../../data-types/page/pageLine';
import {MatMenuTrigger} from '@angular/material';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';

@Component({
  selector: 'app-region-type-context-menu',
  templateUrl: './region-type-context-menu.component.html',
  styleUrls: ['./region-type-context-menu.component.css']
})
export class RegionTypeContextMenuComponent implements OnInit {
  @Output() lineDeleted = new EventEmitter<PageLine>();
  @Output() typeChanged = new EventEmitter<PageLine>();
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;
  @ViewChild('menuTriggerElement') matMenuTriggerEle: ElementRef;
  hasContext = false;
  hasDelete = false;
  public deleteAction: (line: PageLine) => void;
  public typeSelectedAction: (type: BlockType, line: PageLine) => void;
  public addToSelectionAction: () => void;
  readonly BT = BlockType;
  private _line: PageLine;

  constructor(
    private actions: ActionsService,
    private renderer: Renderer2,
  ) { }

  ngOnInit() {
    this._clean();
  }

  public _clean() {
    this.hasContext = false;
    this.hasDelete = false;
    this._line = null;
    this.deleteAction = (line: PageLine) => {
      this.actions.startAction(ActionType.LayoutDelete);
      this.actions.detachLine(line);
      this.lineDeleted.emit(line);
      this.actions.finishAction();
    };
    this.typeSelectedAction = (type: BlockType, line: PageLine) => {
      this.actions.startAction(ActionType.LayoutChangeType);
      const newBlock = this.actions.addNewBlock(line.getBlock().page, type as number as BlockType);
      this.actions.attachLine(newBlock, line);
      this.typeChanged.emit(line);
      this.actions.finishAction();
    };
    this.addToSelectionAction = () => {};
  }

  open(x: number, y: number, line: PageLine, hasContext = false, hasDelete = false) {
    this._line = line;
    this.hasContext = hasContext;
    this.hasDelete = hasDelete;
    const ele = this.matMenuTriggerEle.nativeElement;
    this.renderer.setStyle(ele, 'left', x.toString() + 'px');
    this.renderer.setStyle(ele, 'top', y.toString() + 'px');
    this.matMenuTrigger.openMenu();
  }

  onSelectRegionType(type: BlockType) {
    this.typeSelectedAction(type, this._line);
  }

  onDelete() {
    this.deleteAction(this._line);
  }

  onAddToSelection() {
    this.addToSelectionAction();
  }
}

