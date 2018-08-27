import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LineEditorComponent } from '../line-editor/line-editor.component';
import { StaffGrouperComponent } from '../staff-grouper/staff-grouper.component';
import * as svgPanZoom from 'svg-pan-zoom';
import { Staffs, Staff, StaffLine } from '../musical-symbols/StaffLine';
import { PolyLine, Point } from '../geometry/geometry';
import { StateMachinaService } from '../state-machina.service';
import { StaffsService } from '../staffs.service';
import { SymbolEditorComponent } from '../symbol-editor/symbol-editor.component';
import { SheetOverlayService } from './sheet-overlay.service';
import { Symbol, SymbolType } from '../musical-symbols/symbol';

@Component({
  selector: 'app-sheet-overlay',
  templateUrl: './sheet-overlay.component.html',
  styleUrls: ['./sheet-overlay.component.css']
})
export class SheetOverlayComponent implements OnInit, AfterViewInit {
  symbolType = SymbolType;
  @ViewChild(LineEditorComponent) lineEditor: LineEditorComponent;
  @ViewChild(StaffGrouperComponent) staffGrouper: StaffGrouperComponent;
  @ViewChild(SymbolEditorComponent) symbolEditor: SymbolEditorComponent;
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

  private machina;

  constructor(private stateMachinaService: StateMachinaService,
              private staffService: StaffsService,
              public sheetOverlayService: SheetOverlayService) { }

  ngOnInit() {
    this.sheetOverlayService.svgRoot = this.svgRoot;
    this.staffs = this.staffService.staffs;
    this.machina = this.stateMachinaService.getMachina();
    this.lineEditor.setCallbacks(
      this.lineFinished.bind(this),
      this.lineDeleted.bind(this),
      this.lineUpdated.bind(this)
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

  lineUpdated(line: PolyLine) {
    const staff = this.staffs.staffContainingLine(line);
    if (staff) {
      staff.update();
    }
  }

  lineFinished(line: PolyLine) {
    // get closest staff, check if line is in avg staff line distance, else create a new staff with that line
    const closestStaff = this.sheetOverlayService.closestStaffToMouse;
    if (closestStaff === null) {
      this.staffs.addStaff(new Staff([new StaffLine(line)]));
    } else {
      const y = line.averageY();
      if (closestStaff.lines.length === 1 ||
        (y < closestStaff.aabb.bl().y + closestStaff.avgStaffLineDistance * 2 &&
        y > closestStaff.aabb.tl().y - closestStaff.avgStaffLineDistance * 2)) {
        closestStaff.addLine(new StaffLine(line));
      } else {
        this.staffs.addStaff(new Staff([new StaffLine(line)]));
      }
    }
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
      } else if (this.machina.state === 'toolsSymbols') {
        this.symbolEditor.onMouseMove(event);
      }
    }
  }

  updateClosedStaffToMouse(event: MouseEvent) {
    const p = this.sheetOverlayService.mouseToSvg(event);
    this.sheetOverlayService.closestStaffToMouse = this.staffs.closestStaffToPoint(p);
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
    } else if (this.machina.state === 'toolsSymbols') {
      if (this.symbolEditor.onMouseDown(event)) {
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
    } else if (this.machina.state === 'toolsSymbols') {
      if (!this.dragging) {
        this.symbolEditor.onMouseUp(event);
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
    } else if (this.machina.state === 'toolsSymbols') {
      this.symbolEditor.onMouseDown(event);
    }
  }

  onStaffLineMouseUp(event: MouseEvent, staffLine: StaffLine) {
    if (this.machina.state === 'toolsStaffLines') {
      this.lineEditor.onLineMouseUp(event, staffLine.line);
    } else if (this.machina.state === 'toolsSymbols') {
      this.symbolEditor.onMouseUp(event);
    }
  }

  onStaffLineMouseMove(event: MouseEvent, staffLine: StaffLine) {
    if (this.machina.state === 'toolsStaffLines') {
      this.lineEditor.onLineMouseMove(event, staffLine.line);
    } else if (this.machina.state === 'toolsStaffGroup') {
      this.staffGrouper.onMouseMove(event);
    } else if (this.machina.state === 'toolsSymbols') {
      this.symbolEditor.onMouseMove(event);
    }
  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (this.machina.state === 'toolsSymbols') {
      this.symbolEditor.onSymbolMouseDown(event, symbol);
    }
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    if (this.machina.state === 'toolsSymbols') {
      this.symbolEditor.onSymbolMouseUp(event, symbol);
    }

  }

  onSymbolMouseMove(event: MouseEvent, symbol: Symbol) {
    if (this.machina.state === 'toolsSymbols') {
      this.symbolEditor.onSymbolMouseMove(event, symbol);
    }
  }

  onKeypress(event: KeyboardEvent) {
    if (this.machina.state === 'toolsStaffLines') {
      this.lineEditor.onKeydown(event);
    }
  }
}
