import {ElementRef, Injectable} from '@angular/core';
import {RegionTypeContextMenuComponent} from './region-type-context-menu/region-type-context-menu.component';
import {ContextMenuService} from 'ngx-contextmenu';
import {Point} from '../../../geometry/geometry';

@Injectable({
  providedIn: 'root'
})
export class ContextMenusService {
  regionTypeMenu: RegionTypeContextMenuComponent;

  constructor(
    private contextMenuService: ContextMenuService,
  ) { }

  regionTypeMenuExec(pos: Point): RegionTypeContextMenuComponent {
    const json = new MouseEvent('click',
      {
        button: 2,
        buttons: 1,
        clientX: pos.x,
        clientY: pos.y,
      }
      );
    console.log(json);
    this.contextMenuService.show.next({
      contextMenu: this.regionTypeMenu.menu,
      event: json,
      item: null,
    });
    return this.regionTypeMenu;
  }

}
