import {Component, Input, OnInit, Output, ViewChild} from '@angular/core';
import { PolyLine, Point } from '../../../../geometry/geometry';
import {EventEmitter} from '@angular/core';
import {PolylineEditorComponent} from '../../editors/polyline-editor/polyline-editor.component';

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
