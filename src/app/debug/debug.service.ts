import { Injectable, OnInit } from '@angular/core';
import { ToolBarStateService } from '../tool-bar/tool-bar-state.service';
import { LineEditorService } from '../line-editor/line-editor.service';
import { StaffGrouperService } from '../staff-grouper/staff-grouper.service';
import { SymbolEditorService } from '../symbol-editor/symbol-editor.service';
import { RectEditorService } from '../rect-editor/rect-editor.service';
import { EditorService } from '../editor/editor.service';
import {PolylineEditorService} from '../sheet-overlay/editors/polyline-editor/polyline-editor.service';
import {TextRegionService} from '../sheet-overlay/editor-tools/text-region/text-region.service';
import {TextEditorService} from '../sheet-overlay/editor-tools/text-editor/text-editor.service';

@Injectable({
  providedIn: 'root'
})
export class DebugService {

  constructor(public toolBarService: ToolBarStateService,
              public lineEditorService: LineEditorService,
              public staffGrouperService: StaffGrouperService,
              public symbolEditorService: SymbolEditorService,
              public rectEditorService: RectEditorService,
              public staffsService: EditorService,
              public textEditorService: TextEditorService,
              public textRegionService: TextRegionService,
              public polyLineEditorService: PolylineEditorService,
              ) {
  }
}
