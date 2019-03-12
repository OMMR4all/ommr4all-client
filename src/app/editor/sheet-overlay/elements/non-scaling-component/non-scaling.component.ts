import {Component, OnInit, Input, DoCheck, ChangeDetectorRef} from '@angular/core';
import {Point} from '../../../../geometry/geometry';
import {SheetOverlayService} from '../../sheet-overlay.service';

export enum NonScalingComponentType {
  SQUARE = 0,
  CROSS,
  CIRCLE,
  COMMENT,
}

@Component({
  selector: '[app-element-non-scaling-component]',  // tslint:disable-line component-selector
  templateUrl: './non-scaling.component.html',
  styleUrls: ['./non-scaling.component.css']
})
export class NonScalingComponent implements OnInit, DoCheck {
  private readonly _p = new Point(0, 0);
  Type = NonScalingComponentType;
  @Input() type = NonScalingComponentType.SQUARE;
  @Input() p: Point;
  get s() { return this.scale(this.size); }
  @Input() size = 0;

  constructor(
    private sheetOverlay: SheetOverlayService,
    private changeDetector: ChangeDetectorRef,
  ) { }

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
