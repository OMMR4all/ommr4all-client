import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import {StaffLine} from '../../../../data-types/page/music-region/staff-line';
import {EditorTool} from '../../editor-tools/editor-tool';

@Component({
    selector: '[app-staff-lines-view]',    templateUrl: './staff-lines-view.component.html',
    styleUrls: ['./staff-lines-view.component.css'],
    standalone: false
})
export class StaffLinesViewComponent implements OnInit {
  private changeDetector = inject(ChangeDetectorRef);

  @Input() staffLines: StaffLine[];
  @Input() editorTool: EditorTool;

  constructor() {
    const changeDetector = this.changeDetector;

    changeDetector.detach();
  }

  ngOnInit() {
    this.changeDetector.detectChanges();
  }

  redraw() {
    this.changeDetector.detectChanges();
  }

  onMouseDown(event: MouseEvent, staffLine: StaffLine) {
    if (event.button !== 0) { return; }
    this.editorTool.onStaffLineMouseDown(event, staffLine);
  }

  onMouseUp(event: MouseEvent, staffLine: StaffLine) {
    if (event.button !== 0) { return; }
    this.editorTool.onStaffLineMouseUp(event, staffLine);
  }

  onMouseMove(event: MouseEvent, staffLine: StaffLine) {
    if (event.button !== 0) { return; }
    this.editorTool.onStaffLineMouseMove(event, staffLine);
  }
}
