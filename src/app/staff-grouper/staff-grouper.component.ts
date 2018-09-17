import {Component, OnInit, ViewChild} from '@angular/core';
import { ToolBarStateService } from '../tool-bar/tool-bar-state.service';
import { StaffsService } from '../staffs.service';
import { Rect, Point, Size } from '../geometry/geometry';
import { StaffGrouperService } from './staff-grouper.service';
import { SheetOverlayService } from '../sheet-overlay/sheet-overlay.service';
import { SelectionBoxComponent } from '../selection-box/selection-box.component';

import { Staffs, Staff, StaffLine } from '../musical-symbols/StaffLine';

const machina: any = require('machina');

@Component({
  selector: '[app-staff-grouper]',
  templateUrl: './staff-grouper.component.html',
  styleUrls: ['./staff-grouper.component.css', '../sheet-overlay/sheet-overlay.component.css']
})
export class StaffGrouperComponent implements OnInit {
  @ViewChild(SelectionBoxComponent) selectionBox: SelectionBoxComponent;
  private staffs: Staffs;

  private states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {
        _onEnter: () => {
          if (this.selectionBox) {
            this.selectionBox.states.transition('idle');
          }
        },
      },
    }
  });

  constructor(private toolBarStateService: ToolBarStateService,
              private staffService: StaffsService,
              private staffGrouperService: StaffGrouperService,
  ) {
    this.staffGrouperService.states = this.states;
  }

  ngOnInit() {
    this.staffs = this.staffService.staffs;
    this.selectionBox.selectionFinished.subscribe((rect: Rect) => { this.onSelectionFinished(rect); })
    this.toolBarStateService.editorToolChanged.subscribe((v) => {this.onToolChanged(v);});
  }

  onSelectionFinished(rect: Rect) {
    const staffLines = this.staffs.listLinesInRect(rect);
    if (staffLines.length > 0) {
      const staff = new Staff(staffLines);
      this.staffs.addStaff(staff);
      this.staffs.cleanup();
    }
  }

  onToolChanged(data) {
    this.states.transition('idle');
  }

  onMouseDown(event: MouseEvent): boolean {
    if (this.states.state === 'idle') {
      this.selectionBox.onMouseDown(event);
      return true;
    }
    return false;
  }

  onMouseUp(event: MouseEvent) {
    this.selectionBox.onMouseUp(event);
  }

  onMouseMove(event: MouseEvent) {
    this.selectionBox.onMouseMove(event);
  }

}
