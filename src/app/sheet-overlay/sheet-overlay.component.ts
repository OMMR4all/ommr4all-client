import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LineEditorComponent} from '../line-editor/line-editor.component';
import * as svgPanZoom from 'svg-pan-zoom';
import { Staffs, Staff, StaffLine } from '../musical-symbols/StaffLine';
import { Line, Point } from '../geometry/geometry';
import {bind} from '../../../node_modules/@angular/core/src/render3/instructions';

@Component({
  selector: 'app-sheet-overlay',
  templateUrl: './sheet-overlay.component.html',
  styleUrls: ['./sheet-overlay.component.css']
})
export class SheetOverlayComponent implements OnInit, AfterViewInit {
  @ViewChild(LineEditorComponent) lineEditor: LineEditorComponent;
  @ViewChild('svgRoot')
    private svgRoot: ElementRef;
  sheetUrl = 'assets/examples/LaBudde_Marr_TheBookofGregorianChant.jpg';
  sheetHeight = 1000;
  sheetWidth = 736;

  private clickX: number;
  private clickY: number;
  private dragging = false;
  private minDragDistance = 10;
  private mouseDown = false;

  staffs = new Staffs();

  constructor() { }

  ngOnInit() {
    this.lineEditor.setCallbacks(
      this.lineFinished.bind(this),
      this.getSvgPoint.bind(this),
      this.lineDeleted.bind(this)
    )
    this.staffs.addStaff(new Staff([]));
  }

  ngAfterViewInit() {
    svgPanZoom('#svgRoot', {
      viewportSelector: '#svgRoot',
      eventsListenerElement: document.querySelector('#svgSheet'),
      beforePan: this.beforePan.bind(this),
      dblClickZoomEnabled: false
    });
  }

  getSvgPoint(x, y) {
    const viewport = this.svgRoot.nativeElement.children[0];
    let svgDropPoint = this.svgRoot.nativeElement.createSVGPoint();

    svgDropPoint.x = x;
    svgDropPoint.y = y;

    svgDropPoint = svgDropPoint.matrixTransform(viewport.getCTM().inverse());
    return new Point(svgDropPoint.x, svgDropPoint.y);
  }

  lineFinished(line: Line) {
    this.staffs.get(0).addLine(new StaffLine(line));
  }

  lineDeleted(line: Line) {
    this.staffs.removeLine(line);
  }

  beforePan(n, o) {
    return {x: this.dragging, y: this.dragging};
  }

  onMouseMove(event: MouseEvent) {
    if (this.mouseDown) {
      const dx = event.clientX - this.clickX;
      const dy = event.clientY - this.clickY;
      if (dx * dx + dy * dy > this.minDragDistance * this.minDragDistance) {
        this.dragging = true;
      }
    } else {
      this.lineEditor.onMouseMove(event);
    }
  }

  onMouseDown(event: MouseEvent) {
    if (this.lineEditor.onMouseDown(event)) {
      return;
    }
    this.clickX = event.clientX;
    this.clickY = event.clientY;
    this.dragging = false;
    this.mouseDown = true;
  }

  onMouseUp(event: MouseEvent) {
    if (!this.dragging) {
      this.lineEditor.onMouseUp(event);
    }
    this.clickX = null;
    this.clickY = null;
    this.dragging = false;
    this.mouseDown = false;
  }

  onStaffLineMouseDown(event: MouseEvent, staffLine: StaffLine) {
    this.lineEditor.onLineMouseDown(event, staffLine.line);
  }

  onStaffLineMouseUp(event: MouseEvent, staffLine: StaffLine) {
    this.lineEditor.onLineMouseUp(event, staffLine.line);
  }

  onStaffLineMouseMove(event: MouseEvent, staffLine: StaffLine) {
    this.lineEditor.onLineMouseMove(event, staffLine.line);
  }

  onKeypress(event: KeyboardEvent) {
    this.lineEditor.onKeydown(event);
  }
}
