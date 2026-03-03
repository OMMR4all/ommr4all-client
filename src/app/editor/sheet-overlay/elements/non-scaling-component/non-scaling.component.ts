import { Component, OnInit, Input, DoCheck, ChangeDetectorRef, inject } from '@angular/core';
import {Point} from '../../../../geometry/geometry';
import {SheetOverlayService} from '../../sheet-overlay.service';

export enum NonScalingComponentType {
  SQUARE = 0,
  CROSS,
  CIRCLE,
  COMMENT,
}

@Component({
    selector: '[app-element-non-scaling-component]',    templateUrl: './non-scaling.component.html',
    styleUrls: ['./non-scaling.component.css'],
    standalone: false
})
export class NonScalingComponent implements OnInit, DoCheck {
  private sheetOverlay = inject(SheetOverlayService);
  private changeDetector = inject(ChangeDetectorRef);

  private readonly _p = new Point(0, 0);
  Type = NonScalingComponentType;
  @Input() type = NonScalingComponentType.SQUARE;
  @Input() p: Point;
  get s() { return this.scale(this.size); }
  @Input() size = 0;

  ngOnInit() {
  }

  ngDoCheck(): void {
    if (!this._p.equals(this.p)) {
      this._p.copyFrom(this.p);
      this.changeDetector.markForCheck();
    }
  }

  private scale(v: number) { return this.sheetOverlay.scaleIndependentSize(v); }

}
