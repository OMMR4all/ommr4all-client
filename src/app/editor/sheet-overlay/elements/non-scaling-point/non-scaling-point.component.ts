import {Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, DoCheck} from '@angular/core';
import {Point} from '../../../../geometry/geometry';

@Component({
  selector: '[app-element-non-scaling-point]',
  templateUrl: './non-scaling-point.component.html',
  styleUrls: ['./non-scaling-point.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NonScalingPointComponent implements OnInit, DoCheck {
  private _p: Point = new Point(0, 0);
  @Input() p: Point;
  @Input() selected: false;

  constructor(
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

}
