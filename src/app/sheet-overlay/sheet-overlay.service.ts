import { ElementRef, Injectable } from '@angular/core';
import { Staff } from '../musical-symbols/StaffLine';
import { Point } from '../geometry/geometry';
import { Symbol } from '../musical-symbols/symbol';

@Injectable({
  providedIn: 'root'
})
export class SheetOverlayService {
  private _closestStaffToMouse: Staff = null;
  private _svgRoot: ElementRef = null;
  private _selectedSymbol: Symbol = null;

  constructor() { }

  get closestStaffToMouse() {
    return this._closestStaffToMouse;
  }

  set closestStaffToMouse(staff: Staff) {
    this._closestStaffToMouse = staff;
  }

  get svgRoot() {
    return this._svgRoot;
  }

  set svgRoot(root) {
    this._svgRoot = root;
  }

  mouseToSvg(event: MouseEvent) {
    const viewport = this.svgRoot.nativeElement.children[0];
    let svgDropPoint = this.svgRoot.nativeElement.createSVGPoint();

    svgDropPoint.x = event.clientX;
    svgDropPoint.y = event.clientY;

    svgDropPoint = svgDropPoint.matrixTransform(viewport.getScreenCTM().inverse());
    return new Point(svgDropPoint.x, svgDropPoint.y);
  }

  get selectedSymbol(): Symbol {
    return this._selectedSymbol;
  }

  set selectedSymbol(s: Symbol) {
    this._selectedSymbol = s;
  }

}
