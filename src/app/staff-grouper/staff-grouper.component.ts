import {Component, OnInit, ViewChild} from '@angular/core';
import {ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {EditorService} from '../editor/editor.service';
import {Rect} from '../geometry/geometry';
import {StaffGrouperService} from './staff-grouper.service';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';
import {SelectionBoxComponent} from '../selection-box/selection-box.component';

import {EditorTool} from '../sheet-overlay/editor-tools/editor-tool';
import {EmptyMusicRegionDefinition} from '../data-types/page/definitions';

const machina: any = require('machina');

@Component({
  selector: '[app-staff-grouper]',  // tslint:disable-line component-selector
  templateUrl: './staff-grouper.component.html',
  styleUrls: ['./staff-grouper.component.css', '../sheet-overlay/sheet-overlay.component.css']
})
export class StaffGrouperComponent extends EditorTool implements OnInit {
  @ViewChild(SelectionBoxComponent) selectionBox: SelectionBoxComponent;

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private toolBarStateService: ToolBarStateService,
    private editorService: EditorService,
    private staffGrouperService: StaffGrouperService,
  ) {
    super(sheetOverlayService);
    this._states = new machina.Fsm({
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

    this.staffGrouperService.states = this.states;
  }

  ngOnInit() {
    this.selectionBox.selectionFinished.subscribe((rect: Rect) => { this.onSelectionFinished(rect); });
    this.toolBarStateService.editorToolChanged.subscribe((v) => {this.onToolChanged(v); });
  }

  onSelectionFinished(rect: Rect) {
    const staffLines = this.editorService.pcgts.page.listLinesInRect(rect);
    if (staffLines.length > 0) {
      const mr = this.editorService.pcgts.page.addNewMusicRegion();
      const staff = mr.createMusicLine();
      staffLines.forEach(line => staff.addStaffLine(line));
      this.editorService.pcgts.page.cleanMusicRegions(EmptyMusicRegionDefinition.HasStaffLines);
      /* const staff = new Staff(staffLines);
      this.staffs.addStaff(staff);
      this.staffs.cleanup(); */
    }
  }

  onToolChanged(data) {
    this.states.transition('idle');
  }

  onMouseDown(event: MouseEvent): boolean {
    if (this.states.state === 'idle') {
      this.selectionBox.initialMouseDown(event);
      return true;
    }
    return false;
  }

  onMouseUp(event: MouseEvent) {
  }

  onMouseMove(event: MouseEvent) {
  }

}
