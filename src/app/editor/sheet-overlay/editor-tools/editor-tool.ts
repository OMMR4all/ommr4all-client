import {SheetOverlayService} from '../sheet-overlay.service';
import {Point} from '../../../geometry/geometry';
import {EditorService} from '../../editor.service';
import {TextLine} from '../../../data-types/page/text-line';
import {TextRegion} from '../../../data-types/page/text-region';
import {Symbol} from '../../../data-types/page/music-region/symbol';
import {Connection, NeumeConnector, SyllableConnector} from '../../../data-types/page/annotations';
import construct = Reflect.construct;
import {LogicalConnection, MusicLine} from '../../../data-types/page/music-region/music-line';
import {StaffLine} from '../../../data-types/page/music-region/staff-line';
import {Region} from '../../../data-types/page/region';

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

  onStaffAABBMouseDown(event: MouseEvent, staff: MusicLine) { }

  onTextRegionMouseDown(event: MouseEvent, textRegion: TextRegion) { this.onMouseDown(event); }
  onTextRegionMouseUp(event: MouseEvent, textRegion: TextRegion) { this.onMouseUp(event); }
  onTextRegionMouseMove(event: MouseEvent, textRegion: TextRegion) { this.onMouseMove(event); }

  onTextLineMouseDown(event: MouseEvent, textLine: TextLine) { this.onMouseDown(event); }
  onTextLineMouseUp(event: MouseEvent, textLine: TextLine) { this.onMouseUp(event); }
  onTextLineMouseMove(event: MouseEvent, textLine: TextLine) { this.onMouseMove(event); }

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

  isStaffLineSelectable(sl: StaffLine): boolean { return false; }
  isRegionSelectable(region: Region): boolean { return false; }
  isSymbolSelectable(symbol: Symbol): boolean { return false; }
  isLogicalConnectionSelectable(lc: LogicalConnection): boolean { return false; }

  useCrossHairCursor(): boolean { return false; }
  useMoveCursor() { return false; }

  reset() {
    this._states.transition('idle');
  }

}

export class DummyEditorTool extends EditorTool {
  constructor(protected sheetOverlayService: SheetOverlayService) { super(sheetOverlayService); }
}
