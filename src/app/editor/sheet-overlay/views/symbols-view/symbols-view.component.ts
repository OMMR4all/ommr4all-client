import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {PageLine} from '../../../../data-types/page/pageLine';
import {EditorTool} from '../../editor-tools/editor-tool';
import {Note, Symbol} from '../../../../data-types/page/music-region/symbol';
import {SymbolConnection} from '../../sheet-overlay.service';
import {GraphicalConnectionType, SymbolType} from '../../../../data-types/page/definitions';
import {SymbolEditorComponent} from '../../editor-tools/symbol-editor/symbol-editor.component';

@Component({
  selector: '[app-symbols-view]',  // tslint:disable-line component-selector
  templateUrl: './symbols-view.component.html',
  styleUrls: ['./symbols-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolsViewComponent implements OnInit, OnChanges {
  @Input() staff: PageLine;
  @Input() editorTool: EditorTool;

  constructor(
    protected changeDetector: ChangeDetectorRef,
  ) {
    this.changeDetector.detach();
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.editorTool && this.editorTool instanceof SymbolEditorComponent) {
      this.changeDetector.detectChanges();
    }
  }

  symbolConnection(i, symbol: Symbol): SymbolConnection {
    const connection = new SymbolConnection();
    if (symbol.symbol === SymbolType.Note) {
      const note = symbol as Note;
      if (note.graphicalConnection === GraphicalConnectionType.Looped) {
        connection.graphicalConnected = true;
      } else if (note.isNeumeStart) {
        connection.isNeumeStart = true;
        return connection;
      }

      connection.note = note.getPrevByType(Note) as Note;
    }
    return connection;
  }

  redraw() {
    this.changeDetector.detectChanges();
  }
}
