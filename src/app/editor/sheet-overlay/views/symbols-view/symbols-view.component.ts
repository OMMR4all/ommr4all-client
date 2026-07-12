import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import {Subscription} from 'rxjs';
import {skip} from 'rxjs/operators';
import {PageLine} from '../../../../data-types/page/pageLine';
import {EditorTool} from '../../editor-tools/editor-tool';
import {Note, MusicSymbol} from '../../../../data-types/page/music-region/symbol';
import {SymbolConnection} from '../../sheet-overlay.service';
import {GraphicalConnectionType, SymbolType} from '../../../../data-types/page/definitions';
import {SymbolEditorComponent} from '../../editor-tools/symbol-editor/symbol-editor.component';
import {UserViewSettingsService} from '../../../../user-view-settings.service';

@Component({
    selector: '[app-symbols-view]',    templateUrl: './symbols-view.component.html',
    styleUrls: ['./symbols-view.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SymbolsViewComponent implements OnInit, OnChanges, OnDestroy {
  protected changeDetector = inject(ChangeDetectorRef);
  private userViewSetting = inject(UserViewSettingsService);
  private _userViewSettingSub: Subscription;

  @Input() staff: PageLine;
  @Input() editorTool: EditorTool;
  @Input() showCenterOnly: true;
  @Input() showSymbolConfidence: false;
  @Input() showAlternateSymbolsView: false;

  constructor() {
    this.changeDetector.detach();
    // skip(1): the BehaviorSubject replays its current value synchronously on subscribe,
    // i.e. during component creation, where detectChanges() is not allowed yet
    this._userViewSettingSub = this.userViewSetting._userConfigStateObs.pipe(skip(1)).subscribe(() => this.redraw());
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this._userViewSettingSub.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.editorTool && this.editorTool instanceof SymbolEditorComponent) {
      this.changeDetector.detectChanges();
    }
  }

  symbolConnection(symbol: MusicSymbol): SymbolConnection {
    const connection = new SymbolConnection();
    if (symbol.symbol === SymbolType.Note) {
      const note = symbol as Note;
      if (note.isNeumeStart) {
        connection.isNeumeStart = true;
        return connection;
      } else if (note.graphicalConnection === GraphicalConnectionType.Looped) {
        connection.graphicalConnected = true;
      }

      connection.note = note.getPrevByType(Note) as Note;
    }
    return connection;
  }

  redraw() {
    this.changeDetector.detectChanges();
  }

  userSettings() {
    return this.userViewSetting._userConfigStateVal;
  }
}
