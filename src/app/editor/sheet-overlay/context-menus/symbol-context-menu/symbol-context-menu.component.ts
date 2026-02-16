import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {ActionsService} from '../../../actions/actions.service';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import {ActionType} from '../../../actions/action-types';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {MusicSymbol} from '../../../../data-types/page/music-region/symbol';

@Component({
  selector: 'app-symbol-context-menu',
  templateUrl: './symbol-context-menu.component.html',
  styleUrls: ['./symbol-context-menu.component.css']
})
export class SymbolContextMenuComponent implements OnInit {
  symbol: MusicSymbol = null;

  @ViewChild(MatMenu) matMenu: MatMenu;
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;
  @ViewChild('menuTriggerElement') matMenuTriggerEle: ElementRef;

  constructor(
    private actions: ActionsService,
    private renderer: Renderer2,
    private sheetOverlayService: SheetOverlayService,
  ) { }

  ngOnInit() {
  }

  open(x: number, y: number, symbol: MusicSymbol) {
    this.symbol = symbol;
    const ele = this.matMenuTriggerEle.nativeElement;
    this.renderer.setStyle(ele, 'left', x.toString() + 'px');
    this.renderer.setStyle(ele, 'top', y.toString() + 'px');
    this.matMenuTrigger.openMenu();
  }

  onDelete() {
    this.actions.startAction(ActionType.SymbolsDelete);
    this.actions.detachSymbol(
      this.symbol,
      this.sheetOverlayService.editorService.pcgts.page.annotations
    );
    this.actions.finishAction();
    this.symbol = null;
  }
}
