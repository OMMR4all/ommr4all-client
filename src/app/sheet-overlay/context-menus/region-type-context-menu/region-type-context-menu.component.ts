import {Component, OnInit, ViewChild} from '@angular/core';
import {RegionTypeContextMenuService, RegionTypesContextMenu} from './region-type-context-menu.service';
import {ContextMenuComponent} from 'ngx-contextmenu';

@Component({
  selector: 'app-region-type-context-menu',
  templateUrl: './region-type-context-menu.component.html',
  styleUrls: ['./region-type-context-menu.component.css']
})
export class RegionTypeContextMenuComponent implements OnInit {
  @ViewChild(ContextMenuComponent) menu: ContextMenuComponent;
  Types = RegionTypesContextMenu;

  constructor(
    public service: RegionTypeContextMenuService,
  ) { }

  ngOnInit() {
  }

}
