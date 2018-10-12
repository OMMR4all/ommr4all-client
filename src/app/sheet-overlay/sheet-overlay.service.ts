import {ElementRef, EventEmitter, Injectable, Input, Output} from '@angular/core';
import { Point } from '../geometry/geometry';
import { Symbol } from '../data-types/page/music-region/symbol';
import {MusicLine} from '../data-types/page/music-region/music-line';
import {EditorService} from '../editor/editor.service';
import {MusicRegion} from '../data-types/page/music-region/music-region';
import {Region} from '../data-types/page/region';

@Injectable({
  providedIn: 'root'
})
export class SheetOverlayService {
  @Output() mouseDown = new EventEmitter<MouseEvent>();
  @Output() mouseUp = new EventEmitter<MouseEvent>();
  @Output() mouseMove = new EventEmitter<MouseEvent>();
  private _closestStaffToMouse: MusicLine = null;
  private _closestRegionToMouse: Region = null;
  private _svgRoot: ElementRef = null;
  private _svgView = null;
  private _selectedSymbol: Symbol = null;

  constructor(
    public editorService: EditorService,
  ) { }

  get closestStaffToMouse() {
    return this._closestStaffToMouse;
  }

  set closestStaffToMouse(staff: MusicLine) {
    this._closestStaffToMouse = staff;
  }

  get closestRegionToMouse() { return this._closestRegionToMouse; }
  set closestRegionToMouse(region: Region) { this._closestRegionToMouse = region; }

  get svgRoot() { return this._svgRoot; }
  set svgRoot(root) { this._svgRoot = root; }

  get svgView() { return this._svgView; }
  set svgView(view) { this._svgView = view; }

  mouseToSvg(event: MouseEvent) {
    const viewport = this.svgRoot.nativeElement.children[0];
    let svgDropPoint = this.svgRoot.nativeElement.createSVGPoint();

    svgDropPoint.x = event.clientX;
    svgDropPoint.y = event.clientY;

    svgDropPoint = svgDropPoint.matrixTransform(viewport.getScreenCTM().inverse());
    return new Point(svgDropPoint.x, svgDropPoint.y);
  }

  scaleIndependentSize(v: number) {
    if (!this.svgView) { return v; }
    return v / this.svgView.getCTM().a;
  }

  get selectedSymbol(): Symbol {
    return this._selectedSymbol;
  }

  set selectedSymbol(s: Symbol) {
    this._selectedSymbol = s;
  }

}
