import { Component, OnInit, inject } from '@angular/core';
import {ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {EditorService} from '../editor.service';
import {TextEditorService} from '../sheet-overlay/editor-tools/text-editor/text-editor.service';
import {StaffGrouperService} from '../sheet-overlay/editor-tools/staff-grouper/staff-grouper.service';
import {RectEditorService} from '../sheet-overlay/editors/rect-editor/rect-editor.service';
import {PolylineEditorService} from '../sheet-overlay/editors/polyline-editor/polyline-editor.service';
import {LineEditorService} from '../sheet-overlay/editor-tools/line-editor/line-editor.service';
import {SymbolEditorService} from '../sheet-overlay/editor-tools/symbol-editor/symbol-editor.service';
import {SyllableEditorService} from '../sheet-overlay/editor-tools/syllable-editor/syllable-editor.service';
import {StaffSplitterService} from '../sheet-overlay/editor-tools/staff-splitter/staff-splitter.service';

@Component({
    selector: 'app-debug',
    templateUrl: './debug.component.html',
    styleUrls: ['./debug.component.scss'],
    standalone: false
})
export class DebugComponent implements OnInit {
  toolBar = inject(ToolBarStateService);
  lineEditor = inject(LineEditorService);
  staffGrouper = inject(StaffGrouperService);
  staffSplitter = inject(StaffSplitterService);
  symbolEditor = inject(SymbolEditorService);
  rectEditor = inject(RectEditorService);
  staffs = inject(EditorService);
  textEditor = inject(TextEditorService);
  polyLineEditor = inject(PolylineEditorService);
  syllableEditor = inject(SyllableEditorService);


  ngOnInit() {
  }

}
