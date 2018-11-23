import {Component, Input, OnInit, Output} from '@angular/core';
import {TextLine} from '../../../../data-types/text-line';
import {EventEmitter} from '@angular/core';
import {PolyLine} from '../../../../geometry/geometry';

@Component({
  selector: '[app-element-text-line]',
  templateUrl: './text-line.component.html',
  styleUrls: ['./text-line.component.css']
})
export class TextLineComponent implements OnInit {
  @Input() textLine: TextLine;

  constructor() { }

  ngOnInit() {
  }

}
