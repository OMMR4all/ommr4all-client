import { Component, OnInit } from '@angular/core';
import { ToolBarStateService } from '../tool-bar/tool-bar-state.service';
import { StaffsService } from '../staffs.service';
import { Rect, Point, Size } from '../geometry/geometry';
import { StaffGrouperService } from './staff-grouper.service';
import { SheetOverlayService } from '../sheet-overlay/sheet-overlay.service';

import { Staffs, Staff, StaffLine } from '../musical-symbols/StaffLine';

const machina: any = require('machina');

@Component({
  selector: '[app-staff-grouper]',
  templateUrl: './staff-grouper.component.html',
  styleUrls: ['./staff-grouper.component.css', '../sheet-overlay/sheet-overlay.component.css']
})
export class StaffGrouperComponent implements OnInit {
  private staffs: Staffs;
  private prevMousePoint: Point;
  private mouseToSvg: (event: MouseEvent) => Point;
  selectionRect: Rect;
  initialPoint: Point;

  private states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {
        _onEnter: () => {
          this.selectionRect = null;
          this.initialPoint = null;
          this.prevMousePoint = null;
        },
        drag: 'drag'
      },
      drag: {
        idle: 'idle'
      }
    }
  });

  constructor(private toolBarStateService: ToolBarStateService,
              private staffService: StaffsService,
              private staffGrouperService: StaffGrouperService,
              private sheetOverlayService: SheetOverlayService) {
    this.staffGrouperService.states = this.states;
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
  }

  ngOnInit() {
    this.staffs = this.staffService.staffs;
    this.toolBarStateService.editorToolChanged.subscribe((v) => {this.onToolChanged(v);});
  }

  onToolChanged(data) {
    this.states.transition('idle');
  }

  onMouseDown(event: MouseEvent): boolean {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'idle') {
      this.selectionRect = new Rect(p.copy(), new Size(0, 0));
      this.initialPoint = p;
      this.states.handle('drag');
      return true;
    }
    return false;
  }

  onMouseUp(event: MouseEvent) {
    if (this.states.state === 'drag') {
      const staffLines = this.staffs.listLinesInRect(this.selectionRect);
      if (staffLines.length > 0) {
        const staff = new Staff(staffLines);
        this.staffs.addStaff(staff);
        this.staffs.cleanup();
      }
    }
    this.states.handle('idle');
  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'drag') {
      this.selectionRect = new Rect(this.initialPoint.copy(), p.measure(this.initialPoint));
    }

  }

}
