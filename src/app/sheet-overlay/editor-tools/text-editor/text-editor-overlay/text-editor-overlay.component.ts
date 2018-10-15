import { Component, OnInit } from '@angular/core';
import {Point} from '../../../../geometry/geometry';
import {TextEditorService} from '../text-editor.service';
import {SheetOverlayService} from '../../../sheet-overlay.service';
import {TextRegionType} from '../../../../data-types/page/text-region';

@Component({
  selector: 'app-text-editor-overlay',
  templateUrl: './text-editor-overlay.component.html',
  styleUrls: ['./text-editor-overlay.component.css']
})
export class TextEditorOverlayComponent implements OnInit {
  Mode = TextRegionType;
  get position() {
    return this.sheetOverlayService.localToGlobalPosition(this.textEditorService.currentAABB.bl());
  }

  get width() {
    return this.sheetOverlayService.localToGlobalSize(this.textEditorService.currentAABB.size.w);
  }


  constructor(
    public textEditorService: TextEditorService,
    public sheetOverlayService: SheetOverlayService,
  ) { }

  ngOnInit() {
  }



}
