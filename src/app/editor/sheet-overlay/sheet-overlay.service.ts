import { ElementRef, EventEmitter, Injectable, Output, Directive } from '@angular/core';
import { Point } from '../../geometry/geometry';
import {Note, MusicSymbol} from '../../data-types/page/music-region/symbol';
import {EditorService} from '../editor.service';
import {Region} from '../../data-types/page/region';
import {editorToolToProgressGroup, ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {PageLine} from '../../data-types/page/pageLine';
import {SheetOverlayComponent} from './sheet-overlay.component';

export class SymbolConnection {
  constructor(
    public isNeumeStart = false,
    public graphicalConnected = false,
    public note: Note = null,
  ) {}
}

export class SvgPanZoom {
  constructor(
    public pan = new Point(0, 0),
    public zoom = 1,
  ) {}
}


@Directive()
@Injectable({
  providedIn: 'root'
})
export class SheetOverlayService {
  @Output() mouseDown = new EventEmitter<MouseEvent>();
  @Output() mouseUp = new EventEmitter<MouseEvent>();
  @Output() mouseMove = new EventEmitter<MouseEvent>();
  private _closestStaffToMouse: PageLine = null;
  private _closestRegionToMouse: Region = null;

  readingOrderHoveredPageLine: PageLine = null;

  _sheetOverlayComponent: SheetOverlayComponent;
  svgPanZoom = new SvgPanZoom();

  public static _isDragEvent(event: MouseEvent): boolean {
    return event.button === 1 || (event.button === 0 && event.altKey);
  }

  constructor(
    public editorService: EditorService,
    private toolBarService: ToolBarStateService,
  ) {
  }

  get closestStaffToMouse() {
    return this._closestStaffToMouse;
  }

  set closestStaffToMouse(staff: PageLine) {
    this._closestStaffToMouse = staff;
  }

  get locked() { return this.editorService.pageEditingProgress.getLocked(editorToolToProgressGroup[this.toolBarService.currentEditorTool]); }

  get closestRegionToMouse() { return this._closestRegionToMouse; }
  set closestRegionToMouse(region: Region) { this._closestRegionToMouse = region; }

  mouseToSvg(event: MouseEvent) {
    const rect = (this._sheetOverlayComponent.svgRoot.nativeElement as HTMLElement).getBoundingClientRect();
    const mp = new Point(event.clientX - rect.left, event.clientY - rect.top);
    return this.globalToLocalPos(mp);
  }

  scaleIndependentSize(v: number) {
    return v / this.svgPanZoom.zoom;
  }

  globalToLocalPos(p: Point) {
    return p.subtract(this.svgPanZoom.pan).scale(1 / this.svgPanZoom.zoom);
  }

  localToGlobalPos(p: Point) {
    return p.scale(this.svgPanZoom.zoom).add(this.svgPanZoom.pan);
  }
}
