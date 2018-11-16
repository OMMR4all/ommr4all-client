import {SheetOverlayService} from '../sheet-overlay.service';
import {Point} from '../../geometry/geometry';
import {EditorService} from '../../editor/editor.service';
import {TextLine} from '../../data-types/page/text-line';
import {TextRegion} from '../../data-types/page/text-region';
import {Symbol} from '../../data-types/page/music-region/symbol';
import {Connection, NeumeConnector, SyllableConnector} from '../../data-types/page/annotations';
import construct = Reflect.construct;

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
    sheetOverlayService.editorService.pcgtsObservable.subscribe(pcgts => {
      this.reset();
    });
  }

  onMouseUp(event: MouseEvent): void {}
  onMouseDown(event: MouseEvent): void {}
  onMouseMove(event: MouseEvent): void {}

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

  onKeyup(event: KeyboardEvent) { }
  onKeydown(event: KeyboardEvent) { }

  reset() {
    this._states.transition('idle');
  }

}

export class DummyEditorTool extends EditorTool {
  constructor(protected sheetOverlayService: SheetOverlayService) { super(sheetOverlayService); }
}
