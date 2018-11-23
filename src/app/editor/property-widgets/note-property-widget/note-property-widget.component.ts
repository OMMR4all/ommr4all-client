import {Component, OnInit} from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay/sheet-overlay.service';
import {Note} from '../../../data-types/page/music-region/symbol';
import {GraphicalConnectionType} from '../../../data-types/page/definitions';

@Component({
  selector: 'app-note-property-widget',
  templateUrl: './note-property-widget.component.html',
  styleUrls: ['./note-property-widget.component.css']
})
export class NotePropertyWidgetComponent implements OnInit {

  constructor(
    public sheetOverlayService: SheetOverlayService
  ) { }

  ngOnInit() {
  }

  get note() {
    if (!this.sheetOverlayService.selectedSymbol || !(this.sheetOverlayService.selectedSymbol instanceof Note)) { return null; }
    return this.sheetOverlayService.selectedSymbol as Note;
  }


  get connection() {
    return this.note.graphicalConnection === GraphicalConnectionType.Looped;
  }

  set connection(b: boolean) {
    this.note.graphicalConnection = b ? GraphicalConnectionType.Looped : GraphicalConnectionType.Gaped;
  }
}
