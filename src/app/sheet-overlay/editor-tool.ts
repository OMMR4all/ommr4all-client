import {SheetOverlayService} from './sheet-overlay.service';
import {Point} from '../geometry/geometry';

export abstract class EditorTool {
  protected mouseToSvg: (event: MouseEvent) => Point;

  protected constructor(
    protected sheetOverlayService: SheetOverlayService
  ) {
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
  }

  abstract onMouseUp(event: MouseEvent): void;
  abstract onMouseDown(event: MouseEvent): void;
  abstract onMouseMove(event: MouseEvent): void;

}
