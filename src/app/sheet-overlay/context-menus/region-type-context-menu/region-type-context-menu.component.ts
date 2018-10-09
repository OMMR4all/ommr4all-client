import {Component, OnInit, Output, ViewChild} from '@angular/core';
import {RegionTypeContextMenuService, RegionTypesContextMenu} from './region-type-context-menu.service';
import {ContextMenuComponent} from 'ngx-contextmenu';
import {EventEmitter} from '@angular/core';

@Component({
  selector: 'app-region-type-context-menu',
  templateUrl: './region-type-context-menu.component.html',
  styleUrls: ['./region-type-context-menu.component.css']
})
export class RegionTypeContextMenuComponent implements OnInit {
  @ViewChild(ContextMenuComponent) menu: ContextMenuComponent;
  @Output() triggered = new EventEmitter<RegionTypesContextMenu>();
  Types = RegionTypesContextMenu;

  constructor(
    public service: RegionTypeContextMenuService,
  ) { }

  ngOnInit() {
  }

}
