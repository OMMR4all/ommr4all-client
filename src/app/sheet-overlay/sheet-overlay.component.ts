import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LineEditorComponent} from '../line-editor/line-editor.component';
import { StaffGrouperComponent} from '../staff-grouper/staff-grouper.component';
import * as svgPanZoom from 'svg-pan-zoom';
import { Staffs, Staff, StaffLine } from '../musical-symbols/StaffLine';
import { PolyLine, Point } from '../geometry/geometry';
import { StateMachinaService } from '../state-machina.service';
import { StaffsService } from '../staffs.service';

@Component({
  selector: 'app-sheet-overlay',
  templateUrl: './sheet-overlay.component.html',
  styleUrls: ['./sheet-overlay.component.css']
})
export class SheetOverlayComponent implements OnInit, AfterViewInit {
  @ViewChild(LineEditorComponent) lineEditor: LineEditorComponent;
  @ViewChild(StaffGrouperComponent) staffGrouper: StaffGrouperComponent;
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

  staffs: Staffs;
  closestStaffToMouse: Staff = null;

  private machina;

  constructor(private stateMachinaService: StateMachinaService, private staffService: StaffsService) { }

  ngOnInit() {
    this.staffs = this.staffService.staffs;
    this.machina = this.stateMachinaService.getMachina();
    this.lineEditor.setCallbacks(
      this.getSvgPoint.bind(this),
      this.lineFinished.bind(this),
      this.lineDeleted.bind(this),
      this.lineUpdated.bind(this)
    );
    this.staffGrouper.setCallbacks(
      this.getSvgPoint.bind(this)
    );
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

  lineUpdated(line: PolyLine) {
    const staff = this.staffs.staffContainingLine(line);
    if (staff) {
      staff.updateaabb();
    }
  }

  lineFinished(line: PolyLine) {
    this.staffs.get(0).addLine(new StaffLine(line));
  }

  lineDeleted(line: PolyLine) {
    this.staffs.removeLine(line);
  }

  beforePan(n, o) {
    return {x: this.dragging, y: this.dragging};
  }

  onMouseMove(event: MouseEvent) {
    this.updateClosedStaffToMouse(event);
    if (this.mouseDown) {
      const dx = event.clientX - this.clickX;
      const dy = event.clientY - this.clickY;
      if (dx * dx + dy * dy > this.minDragDistance * this.minDragDistance) {
        this.dragging = true;
      }
    } else {
      if (this.machina.state === 'toolsStaffLines') {
        this.lineEditor.onMouseMove(event);
      } else if (this.machina.state === 'toolsStaffGroup') {
        this.staffGrouper.onMouseMove(event);
      }
    }
  }

  updateClosedStaffToMouse(event: MouseEvent) {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);
    this.closestStaffToMouse = this.staffs.closestStaffToPoint(p);
  }

  onMouseDown(event: MouseEvent) {
    if (this.machina.state === 'toolsStaffLines') {
        if (this.lineEditor.onMouseDown(event)) {
          return;
        }
    } else if (this.machina.state === 'toolsStaffGroup') {
      if (this.staffGrouper.onMouseDown(event)) {
        return;
      }
    }
    this.clickX = event.clientX;
    this.clickY = event.clientY;
    this.dragging = false;
    this.mouseDown = true;
  }

  onMouseUp(event: MouseEvent) {
    if (this.machina.state === 'toolsStaffGroup') {
      this.staffGrouper.onMouseUp(event);
    } else if (this.machina.state === 'toolsStaffLines') {
      if (!this.dragging) {
        this.lineEditor.onMouseUp(event);
      }
    }
    this.clickX = null;
    this.clickY = null;
    this.dragging = false;
    this.mouseDown = false;
  }

  onStaffLineMouseDown(event: MouseEvent, staffLine: StaffLine) {
    if (this.machina.state === 'toolsStaffLines') {
      this.lineEditor.onLineMouseDown(event, staffLine.line);
    }
  }

  onStaffLineMouseUp(event: MouseEvent, staffLine: StaffLine) {
    if (this.machina.state === 'toolsStaffLines') {
      this.lineEditor.onLineMouseUp(event, staffLine.line);
    }
  }

  onStaffLineMouseMove(event: MouseEvent, staffLine: StaffLine) {
    if (this.machina.state === 'toolsStaffLines') {
      this.lineEditor.onLineMouseMove(event, staffLine.line);
    } else if (this.machina.state === 'toolsStaffGroup') {
      this.staffGrouper.onMouseMove(event);
    }
  }

  onKeypress(event: KeyboardEvent) {
    if (this.machina.state === 'toolsStaffLines') {
      this.lineEditor.onKeydown(event);
    }
  }
}
