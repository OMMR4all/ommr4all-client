import {SheetOverlayService} from '../sheet-overlay.service';
import {Point} from '../../geometry/geometry';
import {EditorService} from '../../editor/editor.service';
import {TextLine} from '../../data-types/page/text-line';
import {TextRegion} from '../../data-types/page/text-region';
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

  abstract onMouseUp(event: MouseEvent): void;
  abstract onMouseDown(event: MouseEvent): void;
  abstract onMouseMove(event: MouseEvent): void;

  onTextRegionMouseDown(event: MouseEvent, textRegion: TextRegion) { this.onMouseDown(event); }
  onTextRegionMouseUp(event: MouseEvent, textRegion: TextRegion) { this.onMouseUp(event); }
  onTextRegionMouseMove(event: MouseEvent, textRegion: TextRegion) { this.onMouseMove(event); }

  onTextLineMouseDown(event: MouseEvent, textLine: TextLine) { this.onMouseDown(event); }
  onTextLineMouseUp(event: MouseEvent, textLine: TextLine) { this.onMouseUp(event); }
  onTextLineMouseMove(event: MouseEvent, textLine: TextLine) { this.onMouseMove(event); }

  onKeyup(event: KeyboardEvent) { }
  onKeydown(event: KeyboardEvent) { }

  reset() {
    this._states.transition('idle');
  }

}
