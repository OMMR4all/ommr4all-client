import {ElementRef, Injectable} from '@angular/core';
import {RegionTypeContextMenuComponent} from './region-type-context-menu/region-type-context-menu.component';
import {ContextMenuService} from 'ngx-contextmenu';
import {IContextMenuClickEvent} from 'ngx-contextmenu';

@Injectable({
  providedIn: 'root'
})
export class ContextMenusService {
  regionTypeMenu: RegionTypeContextMenuComponent;

  constructor(
    private contextMenuService: ContextMenuService,
  ) { }

  regionTypeMenuExec(event: MouseEvent | KeyboardEvent) {
    this.contextMenuService.show.next({
      contextMenu: this.regionTypeMenu.menu,
      event: event,
      item: null,
    });
    event.preventDefault();
    event.stopPropagation();
  }

}
