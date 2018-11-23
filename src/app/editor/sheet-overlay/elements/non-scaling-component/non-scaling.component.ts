import { Component, OnInit, Input } from '@angular/core';
import {Point} from '../../../../geometry/geometry';
import {SheetOverlayService} from '../../sheet-overlay.service';

export enum NonScalingComponentType {
  SQUARE = 0,
  CROSS,
  CIRCLE,
}

@Component({
  selector: '[app-element-non-scaling-component]',  // tslint:disable-line component-selector
  templateUrl: './non-scaling.component.html',
  styleUrls: ['./non-scaling.component.css']
})
export class NonScalingComponent implements OnInit {
  Type = NonScalingComponentType;
  @Input() type = NonScalingComponentType.SQUARE;
  @Input() p: Point;
  get s() { return this.scale(this.size); }
  @Input() size = 0;

  constructor(
    private sheetOverlay: SheetOverlayService,
  ) { }

  ngOnInit() {
  }

  private scale(v: number) { return this.sheetOverlay.scaleIndependentSize(v); }

}
