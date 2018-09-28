import {Component, Input, OnInit} from '@angular/core';
import { PolyLine } from '../../../geometry/geometry';

@Component({
  selector: '[app-element-polyline]',
  templateUrl: './polyline.component.html',
  styleUrls: ['./polyline.component.css']
})
export class PolylineComponent implements OnInit {
  @Input() polyLine: PolyLine;

  constructor() { }

  ngOnInit() {
  }

}
