import {SheetOverlayService} from '../sheet-overlay.service';
import {Point} from '../../geometry/geometry';
import {EditorService} from '../../editor/editor.service';
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

  reset() {
    this._states.transition('idle');
  }

}
