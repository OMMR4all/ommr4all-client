import { Injectable, OnInit } from '@angular/core';
import { StateMachinaService } from '../state-machina.service';
import { LineEditorService } from '../line-editor/line-editor.service';
import { StaffGrouperService } from '../staff-grouper/staff-grouper.service';
import { SymbolEditorService } from '../symbol-editor/symbol-editor.service';

@Injectable({
  providedIn: 'root'
})
export class DebugService {

  constructor(private stateMachinaService: StateMachinaService,
              private lineEditorService: LineEditorService,
              private staffGrouperService: StaffGrouperService,
              private symbolEditorService: SymbolEditorService) {
  }
}
