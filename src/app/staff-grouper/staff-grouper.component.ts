import { Component, OnInit } from '@angular/core';
import { StateMachinaService } from '../state-machina.service';
import { StaffsService } from '../staffs.service';
import { Rect, Point, Size } from '../geometry/geometry';
import { StaffGrouperService } from './staff-grouper.service';

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
  private mainMachina;
  private getSvgPoint: (x: number, y: number) => Point;
  selectionRect: Rect;
  initialPoint: Point;

  private states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {
        _onEnter: function() {
          this.selectionRect = null;
          this.initialPoint = null;
          this.prevMousePoint = null;
        }.bind(this),
        drag: 'drag'
      },
      drag: {
        idle: 'idle'
      }
    }
  });

  constructor(private stateMachinaService: StateMachinaService, private staffService: StaffsService, private staffGrouperService: StaffGrouperService) {
    this.staffGrouperService.states = this.states;
  }

  ngOnInit() {
    this.staffs = this.staffService.staffs;
    this.mainMachina = this.stateMachinaService.getMachina();
    this.mainMachina.on('transition', this.onMainMachinaTransition.bind(this));
  }

  setCallbacks(
    svgPointCallback: (x: number, y: number) => Point) {
    this.getSvgPoint = svgPointCallback;
  }

  onMainMachinaTransition(data) {
    if (data.fromState === 'toolsStaffGroup' && data.fromState !== data.toState) {
      this.states.transition('idle');
    }
  }

  onMouseDown(event: MouseEvent): boolean {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);
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
        this.staffs.refresh();
      }
    }
    this.states.handle('idle');
  }

  onMouseMove(event: MouseEvent) {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);
    this.prevMousePoint = p;

    if (this.states.state === 'drag') {
      this.selectionRect = new Rect(this.initialPoint.copy(), p.measure(this.initialPoint));
    }

  }

}
