import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay/sheet-overlay.service';
import {Note} from '../../../data-types/page/music-region/symbol';
import {GraphicalConnectionType} from '../../../data-types/page/definitions';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';

@Component({
  selector: 'app-note-property-widget',
  templateUrl: './note-property-widget.component.html',
  styleUrls: ['./note-property-widget.component.css'],
})
export class NotePropertyWidgetComponent implements OnInit {
  @Input() selectedSymbol: Symbol = null;
  @Output() noteChanged = new EventEmitter<Note>();

  constructor(
    public sheetOverlayService: SheetOverlayService,
    private actions: ActionsService,
  ) { }

  ngOnInit() {
  }

  get note() {
    if (!this.selectedSymbol || !(this.selectedSymbol instanceof Note)) { return null; }
    return this.selectedSymbol as Note;
  }

  get neumeStart() {
    return this.note.isNeumeStart;
  }

  set neumeStart(b: boolean) {
    this.actions.startAction(ActionType.SymbolsChangeNeumeStart);
    this.actions.changeNeumeStart(this.note, b);
    this.actions.finishAction();
    this.noteChanged.emit(this.note);
  }

  get connection() {
    return this.note.graphicalConnection === GraphicalConnectionType.Looped;
  }

  set connection(b: boolean) {
    this.actions.startAction(ActionType.SymbolsChangeGraphicalConnection);
    this.actions.changeGraphicalConnection(this.note, b ? GraphicalConnectionType.Looped : GraphicalConnectionType.Gaped);
    this.actions.finishAction();
    this.noteChanged.emit(this.note);
  }
}
