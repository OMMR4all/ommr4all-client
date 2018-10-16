import { Component, OnInit } from '@angular/core';
import {SyllableEditorService} from '../syllable-editor.service';
import {Point} from '../../../../geometry/geometry';
import {SheetOverlayService} from '../../../sheet-overlay.service';

@Component({
  selector: 'app-syllable-editor-overlay',
  templateUrl: './syllable-editor-overlay.component.html',
  styleUrls: ['./syllable-editor-overlay.component.css']
})
export class SyllableEditorOverlayComponent implements OnInit {
  position = new Point(0, 0);

  constructor(
    public syllableEditorService: SyllableEditorService,
    private sheetOverlayService: SheetOverlayService
  ) {
    sheetOverlayService.mouseMove.subscribe(event => this.onMouseMove(event));
  }

  ngOnInit() {
  }

  onMouseMove(event: MouseEvent) {
    this.position.x = event.clientX;
    this.position.y = event.clientY;
  }
}
