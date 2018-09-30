import { Component, OnInit, Input } from '@angular/core';
import {Point} from '../../../geometry/geometry';

@Component({
  selector: '[app-element-non-scaling-point]',
  templateUrl: './non-scaling-point.component.html',
  styleUrls: ['./non-scaling-point.component.css']
})
export class NonScalingPointComponent implements OnInit {
  @Input() p: Point;
  @Input() selected: false;

  constructor() { }

  ngOnInit() {
  }

}
