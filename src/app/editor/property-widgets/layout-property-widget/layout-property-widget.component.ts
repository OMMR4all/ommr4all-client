import { Component, OnInit } from '@angular/core';
import {BlockType} from '../../../data-types/page/definitions';
import {LayoutPropertyWidgetService} from './layout-property-widget.service';

@Component({
  selector: 'app-layout-property-widget',
  templateUrl: './layout-property-widget.component.html',
  styleUrls: ['./layout-property-widget.component.css']
})
export class LayoutPropertyWidgetComponent implements OnInit {
  Type = BlockType;

  constructor(
    public service: LayoutPropertyWidgetService,
  ) { }

  ngOnInit() {
  }

}
