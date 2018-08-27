import { ElementRef, Injectable } from '@angular/core';
import { Staff } from '../musical-symbols/StaffLine';
import { Point } from '../geometry/geometry';

@Injectable({
  providedIn: 'root'
})
export class SheetOverlayService {
  private _closestStaffToMouse: Staff = null;
  private _svgRoot: ElementRef = null;

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
    if (this._svgRoot) {
      console.error('SVG Root may only be set once');
    }
    this._svgRoot = root;
  }

  getSvgPoint(x, y) {
    const viewport = this.svgRoot.nativeElement.children[0];
    let svgDropPoint = this.svgRoot.nativeElement.createSVGPoint();

    svgDropPoint.x = x;
    svgDropPoint.y = y;

    svgDropPoint = svgDropPoint.matrixTransform(viewport.getCTM().inverse());
    return new Point(svgDropPoint.x, svgDropPoint.y);
  }

}
