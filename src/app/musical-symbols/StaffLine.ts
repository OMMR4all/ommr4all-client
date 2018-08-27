import { PolyLine, Rect, Point, Size } from '../geometry/geometry';
import { SymbolList, Symbol } from './symbol';
import {forEach} from '../../../node_modules/@angular/router/src/utils/collection';

export class StaffLine {
  line: PolyLine = null;
  staff: Staff = null;
  readonly _aabb = new Rect(new Point(0, 0), new Size(0, 0));

  constructor(line: PolyLine) {
    this.line = line;
  }

  get aabb() {
    return this._aabb;
  }

  getPath() {
    return this.line.getPath();
  }

  remove() {
    this.staff.removeStaffLine(this);
    this.staff = null;
    this.updateaabb();
  }

  updateaabb() {
    this._aabb.copyFrom(this.line.aabb());
  }

}

export class Staff {
  readonly _lines: StaffLine[];
  readonly _symbolList = new SymbolList();
  readonly _aabb = new Rect(new Point(0, 0), new Size(0, 0));
  private _avgStaffLineDistance = 0;

  constructor(lines: StaffLine[]) {
    this._lines = lines;
    this._lines.forEach(function(line) {
      if (line.staff) {
        line.staff.removeStaffLine(line);
      }
      line.staff = this;
    }.bind(this));
  }

  get symbolList() {
    return this._symbolList;
  }

  get aabb() {
    return this._aabb;
  }

  get lines(): StaffLine[] {
    return this._lines;
  }

  get avgStaffLineDistance() {
    return this._avgStaffLineDistance;
  }

  addLine(line: StaffLine): void {
    this._lines.push(line);
    line.staff = this;
  }

  removeStaffLine(line: StaffLine): boolean {
    if (line) {
      const idx = this._lines.indexOf(line);
      if (idx >= 0) {
        this._lines.splice(idx, 1);
        this.update();
        return true;
      }
    }
    return false;
  }

  removeLine(line: PolyLine): boolean {
    for (let idx = 0; idx < this._lines.length; idx++) {
      if (this._lines[idx].line === line) {
        this._lines.splice(idx, 1);
        this.update();
        return true;
      }
    }
    return false;
  }

  update() {
    this._updateSorting();
    this._updateaabb();
    this._updateAvgStaffLineDistance();
  }

  private _updateSorting() {
    this._lines.sort((a: StaffLine, b: StaffLine) => a.line.averageY() - b.line.averageY());
  }

  private _updateAvgStaffLineDistance() {
    this._avgStaffLineDistance = this._computeAvgStaffLineDistance();
  }

  private _updateaabb() {
    if (this._lines.length === 0) {
      this._aabb.zero();
      return;
    }
    this._lines.forEach(function (line) {
      line.updateaabb();
    });
    this._aabb.copyFrom(this._lines[0].aabb.copy());
    for (let i = 1; i < this._lines.length; i++) {
      this._aabb.copyFrom(this._aabb.union(this._lines[i].aabb));
    }
  }

  containsStaffLine(line: StaffLine): boolean {
    return this._lines.indexOf(line) >= 0;
  }

  containsLine(line: PolyLine): boolean {
    for (let i = 0; i < this._lines.length; i++) {
      if (this._lines[i].line === line) {
        return true;
      }
    }
    return false;
  }

  distanceSqrToPoint(p: Point): number {
    return this._aabb.distanceSqrToPoint(p);
  }

  private _computeAvgStaffLineDistance(): number {
    if (this._lines.length <= 1) {
      return 5;  // TODO: Default value?
    }
    return (this._lines[this._lines.length - 1].line.averageY() - this._lines[0].line.averageY()) / (this._lines.length - 1);
  }

  snapToStaff(p: Point): number {
    if (this._lines.length <= 1) {
      return p.y;
    }
    const yOnStaff = [];
    for (const staffLine of this._lines) {
      yOnStaff.push(staffLine.line.interpolateY(p.x));
    }
    yOnStaff.sort((n1, n2) => n1 - n2);
    const avgStaffDistance = (yOnStaff[yOnStaff.length - 1] - yOnStaff[0]) / (yOnStaff.length - 1);

    if (p.y <= yOnStaff[0]) {
      const d = yOnStaff[0] - p.y;
      return yOnStaff[0] - Math.round(2 * d / avgStaffDistance) * avgStaffDistance / 2;
    } else if (p.y >= yOnStaff[yOnStaff.length - 1]) {
      const d = p.y - yOnStaff[yOnStaff.length - 1];
      return yOnStaff[yOnStaff.length - 1] + Math.round(2 * d / avgStaffDistance) * avgStaffDistance / 2;
    } else {
      let y1 = yOnStaff[0];
      let y2 = yOnStaff[1];
      for (let i = 2; i < yOnStaff.length; i++) {
        if (p.y >= y2) {
          y1 = y2;
          y2 = yOnStaff[i];
        }
      }
      const d = p.y - y1;
      return y1 + Math.round(2 * d / (y2 - y1)) * (y2 - y1) / 2;
    }
  }
}

export class Staffs {
  readonly _staffs: Staff[] = [];

  constructor() {

  }

  get staffs(): Staff[] {
    return this._staffs;
  }

  get(idx: number): Staff {
    return this._staffs[idx];
  }

  addStaff(staff: Staff): void {
    this._staffs.push(staff);
  }

  removeStaff(staff: Staff): void {
    if (staff) {
      const idx = this._staffs.indexOf(staff);
      if (idx >= 0) {
        this._staffs.splice(idx, 1);
      }
    }
  }

  removeLine(line: PolyLine): void {
    if (!line) {
      return;
    }

    for (const staff of this._staffs) {
      if (staff.removeLine(line)) {
        break;
      }
    }
  }

  staffContainingLine(line: PolyLine): Staff {
    if (!line) {
      return null;
    }

    for (const staff of this._staffs) {
      if (staff.containsLine(line)) {
        return staff;
      }
    }
    return null;
  }

  listLinesInRect(rect: Rect): StaffLine[] {
    const outLines: StaffLine[] = [];
    for (const staff of this._staffs) {
      if (staff._aabb.intersetcsWithRect(rect)) {
        for (const staffLine of staff.lines) {
          if (staffLine.aabb.intersetcsWithRect(rect)) {
            if (staffLine.line.intersectsWithRect(rect)) {
              outLines.push(staffLine);
            }
          }
        }
      }
    }
    return outLines;
  }

  refresh() {
    for (let i = 0; i < this._staffs.length; i++) {
      const staff = this._staffs[i];
      if (staff.lines.length === 0) {
        this._staffs.splice(i, 1);
        i -= 1;
        continue;
      }
      staff.update();
    }
  }

  closestStaffToPoint(p: Point) {
    if (this._staffs.length === 0) {
      return null;
    }
    let bestStaff = this._staffs[0];
    let bestDistSqr = this._staffs[0].distanceSqrToPoint(p);
    for (let i = 1; i < this._staffs.length; i++) {
      const d = this._staffs[i].distanceSqrToPoint(p);
      if (d < bestDistSqr) {
        bestDistSqr = d;
        bestStaff = this._staffs[i];
      }
    }
    if (bestDistSqr >= 10e8) {
      return null;
    }
    return bestStaff;
  }
}
