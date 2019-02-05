import {SheetOverlayService} from '../sheet-overlay.service';
import {Point} from '../../../geometry/geometry';
import {Symbol} from '../../../data-types/page/music-region/symbol';
import {Connection, NeumeConnector, SyllableConnector} from '../../../data-types/page/annotations';
import {StaffLine} from '../../../data-types/page/music-region/staff-line';
import {Region} from '../../../data-types/page/region';
import {Block} from '../../../data-types/page/block';
import {PageLine, LogicalConnection} from '../../../data-types/page/pageLine';

const machina: any = require('machina');

export abstract class EditorTool {
  protected mouseToSvg: (event: MouseEvent) => Point;
  protected _states = new machina.Fsm({initialState: 'idle', states: {idle: {}}});
  get states() { return this._states; }
  get state() { return this._states.state; }

  protected constructor(
    protected sheetOverlayService: SheetOverlayService,
  ) {
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
    sheetOverlayService.editorService.pageStateObs.subscribe(state => {
      this.reset();
    });
  }

  onMouseUp(event: MouseEvent): void {}
  onMouseDown(event: MouseEvent): void {}
  onMouseMove(event: MouseEvent): void {}

  onStaffLineMouseDown(event: MouseEvent, staffLine: StaffLine) { this.onMouseDown(event); }
  onStaffLineMouseUp(event: MouseEvent, staffLine: StaffLine) { this.onMouseUp(event); }
  onStaffLineMouseMove(event: MouseEvent, staffLine: StaffLine) { this.onMouseMove(event); }

  onStaffAABBMouseDown(event: MouseEvent, staff: PageLine) { }

  onLineMouseDown(event: MouseEvent, line: PageLine) { this.onMouseDown(event); }
  onLineMouseUp(event: MouseEvent, line: PageLine) { this.onMouseUp(event); }
  onLineMouseMove(event: MouseEvent, line: PageLine) { this.onMouseMove(event); }
  onLineContextMenu(event: MouseEvent, line: PageLine) { }

  onSymbolMouseDown(event: MouseEvent, s: Symbol) { this.onMouseDown(event); }
  onSymbolMouseUp(event: MouseEvent, s: Symbol) { this.onMouseUp(event); }
  onSymbolMouseMove(event: MouseEvent, s: Symbol) { this.onMouseMove(event); }

  onSyllableMouseUp(event: MouseEvent, connection: Connection, syllableConnector: SyllableConnector, neumeConnector: NeumeConnector) {
    this.onMouseUp(event);
  }

  onLogicalConnectionMouseDown(event: MouseEvent, lc: LogicalConnection) { this.onMouseDown(event); }
  onLogicalConnectionMouseUp(event: MouseEvent, lc: LogicalConnection) { this.onMouseUp(event); }

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

}

export class DummyEditorTool extends EditorTool {
  constructor(protected sheetOverlayService: SheetOverlayService) { super(sheetOverlayService); }
}
