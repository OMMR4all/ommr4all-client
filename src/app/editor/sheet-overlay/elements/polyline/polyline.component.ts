import {Component, Input, OnInit, Output, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import { PolyLine, Point } from '../../../../geometry/geometry';
import {EventEmitter} from '@angular/core';
import {PolylineEditorComponent} from '../../editors/polyline-editor/polyline-editor.component';

@Component({
    selector: '[app-element-polyline]',
    templateUrl: './polyline.component.html',
    styleUrls: ['./polyline.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PolylineComponent implements OnInit {
  @Input() polyLine: PolyLine;

  constructor() { }

  ngOnInit() {
  }

}
