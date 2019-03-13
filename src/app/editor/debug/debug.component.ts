import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {
  constructor(public toolBar: ToolBarStateService,
              public lineEditor: LineEditorService,
              public staffGrouper: StaffGrouperService,
              public staffSplitter: StaffSplitterService,
              public symbolEditor: SymbolEditorService,
              public rectEditor: RectEditorService,
              public staffs: EditorService,
              public textEditor: TextEditorService,
              public polyLineEditor: PolylineEditorService,
              public syllableEditor: SyllableEditorService,
  ) { }

  ngOnInit() {
  }

}
