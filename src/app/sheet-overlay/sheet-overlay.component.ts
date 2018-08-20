import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as svgPanZoom from 'svg-pan-zoom';
import { Staff, StaffLine } from '../musical-symbols/StaffLine';
import { Line, Point } from '../geometry/geometry';

@Component({
  selector: 'app-sheet-overlay',
  templateUrl: './sheet-overlay.component.html',
  styleUrls: ['./sheet-overlay.component.css']
})
export class SheetOverlayComponent implements OnInit, AfterViewInit {
  @ViewChild('svgRoot')
    private svgRoot: ElementRef;
  sheetUrl = 'assets/examples/LaBudde_Marr_TheBookofGregorianChant.jpg';
  sheetHeight = 1000;
  sheetWidth = 736;

  staffs = [];

  constructor() { }

  ngOnInit() {
    this.staffs.push(
      new Staff([new StaffLine(new Line([new Point(0, 0), new Point(330, 110)]))])
    );
  }

  ngAfterViewInit() {
    svgPanZoom('#svgRoot');
  }

}
