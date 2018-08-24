import { PolyLine, Rect, Point, Size } from '../geometry/geometry';
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
  readonly _aabb = new Rect(new Point(0, 0), new Size(0, 0));

  constructor(lines: StaffLine[]) {
    this._lines = lines;
    this._lines.forEach(function(line) {
      if (line.staff) {
        line.staff.removeStaffLine(line);
      }
      line.staff = this;
    }.bind(this));
  }

  get aabb() {
    return this._aabb;
  }

  get lines(): StaffLine[] {
    return this._lines;
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
        this.updateaabb();
        return true;
      }
    }
    return false;
  }

  removeLine(line: PolyLine): boolean {
    for (let idx = 0; idx < this._lines.length; idx++) {
      if (this._lines[idx].line === line) {
        this._lines.splice(idx, 1);
        this.updateaabb();
        return true;
      }
    }
    return false;
  }

  updateaabb() {
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
      staff.updateaabb();
    }
  }

  closestStaffToPoint(p: Point) {
    if (this._staffs.length === 0) {return null;}
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
