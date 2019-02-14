import {SheetOverlayService} from '../sheet-overlay.service';
import {Point} from '../../../geometry/geometry';
import {Symbol} from '../../../data-types/page/music-region/symbol';
import {Connection, NeumeConnector, SyllableConnector} from '../../../data-types/page/annotations';
import {StaffLine} from '../../../data-types/page/music-region/staff-line';
import {Region} from '../../../data-types/page/region';
import {Block} from '../../../data-types/page/block';
import {PageLine, LogicalConnection} from '../../../data-types/page/pageLine';
import {ViewSettings} from '../views/view';
import {ViewChangesService} from '../../actions/view-changes.service';

const machina: any = require('machina');

export abstract class EditorTool {
  protected _viewSettings = new ViewSettings();
  protected mouseToSvg: (event: MouseEvent) => Point;
  protected _states = new machina.Fsm({initialState: 'idle', states: {idle: {}}});
  get states() { return this._states; }
  get state() { return this._states.state; }
  protected statesHandle(newState: string, ...args): boolean {
    const oldState = this.state;
    this.states.handle(newState, ...args);
    return this.state !== oldState;
  }

  protected constructor(
    protected sheetOverlayService: SheetOverlayService,
    protected viewChanges: ViewChangesService,
    protected readonly _defaultViewSettings = new ViewSettings(),
  ) {
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
    sheetOverlayService.editorService.pageStateObs.subscribe(state => {
      this.reset();
    });
    this._viewSettings = _defaultViewSettings.copy();
  }

  onMouseUp(event: MouseEvent): void {}
  onMouseDown(event: MouseEvent): void {}
  onMouseMove(event: MouseEvent): void {}

  onStaffLineMouseDown(event: MouseEvent, staffLine: StaffLine) {}
  onStaffLineMouseUp(event: MouseEvent, staffLine: StaffLine) {}
  onStaffLineMouseMove(event: MouseEvent, staffLine: StaffLine) {}

  onStaffAABBMouseDown(event: MouseEvent, staff: PageLine) { }

  onLineMouseDown(event: MouseEvent, line: PageLine) {}
  onLineMouseUp(event: MouseEvent, line: PageLine) {}
  onLineMouseMove(event: MouseEvent, line: PageLine) {}
  onLineContextMenu(event: MouseEvent, line: PageLine) { }

  onSymbolMouseDown(event: MouseEvent, s: Symbol) {}
  onSymbolMouseUp(event: MouseEvent, s: Symbol) {}
  onSymbolMouseMove(event: MouseEvent, s: Symbol) {}

  onSyllableMouseDown(event: MouseEvent, neumeConnector: NeumeConnector) {}
  onSyllableMouseUp(event: MouseEvent, connection: Connection, syllableConnector: SyllableConnector, neumeConnector: NeumeConnector) {}

  onLogicalConnectionMouseDown(event: MouseEvent, lc: LogicalConnection) {}
  onLogicalConnectionMouseUp(event: MouseEvent, lc: LogicalConnection) {}

  onKeyup(event: KeyboardEvent) { }
  onKeydown(event: KeyboardEvent) { }

  receivePageMouseEvents(): boolean { return false; }
  isLineSelectable(line: PageLine): boolean { return false; }
  isStaffLineSelectable(sl: StaffLine): boolean { return false; }
  isRegionSelectable(region: Region): boolean { return false; }
  isSymbolSelectable(symbol: Symbol): boolean { return false; }
  isLogicalConnectionSelectable(lc: LogicalConnection): boolean { return false; }

  useCrossHairCursor(): boolean { return false; }
  useMoveCursor() { return false; }

  reset() {
    this._states.transition('idle');
  }


  // current selections
  get selectedSymbol(): Symbol { return null; }
  get selectedLogicalConnection(): LogicalConnection { return null; }
  get selectedNeumeConnection(): NeumeConnector { return null; }


  // view of editor tool
  resetToDefaultViewSettings() { this.viewSettings = this._defaultViewSettings.copy(); }
  set viewSettings(viewSettings: ViewSettings) {
    if (viewSettings) {
      this._viewSettings = viewSettings;
      this.viewChanges.updateAllLines(this.sheetOverlayService.editorService.pcgts.page);
    }
  }
  get viewSettings() { return this._viewSettings; }
}

export class DummyEditorTool extends EditorTool {
  constructor(
    protected sheetOverlayService: SheetOverlayService,
    protected viewChanges: ViewChangesService,
    ) { super(sheetOverlayService, viewChanges); }
}
