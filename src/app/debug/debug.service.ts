import { Injectable, OnInit } from '@angular/core';
import { StateMachinaService } from '../state-machina.service';
import { LineEditorService } from '../line-editor/line-editor.service';
import { StaffGrouperService } from '../staff-grouper/staff-grouper.service';
import { SymbolEditorService } from '../symbol-editor/symbol-editor.service';
import { RectEditorService } from '../rect-editor/rect-editor.service';
import { StaffsService } from '../staffs.service';
import {LyricsEditorService} from '../lyrics-editor/lyrics-editor.service';

@Injectable({
  providedIn: 'root'
})
export class DebugService {

  constructor(public stateMachinaService: StateMachinaService,
              public lineEditorService: LineEditorService,
              public staffGrouperService: StaffGrouperService,
              public symbolEditorService: SymbolEditorService,
              public rectEditorService: RectEditorService,
              public staffsService: StaffsService,
              public lyricsEditorService: LyricsEditorService,
              ) {
  }
}
