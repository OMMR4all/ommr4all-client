import { Line } from '../geometry/geometry';

export class StaffLine {
  line: Line;
  staff: Staff;

  constructor(line: Line) {
    this.line = line;
  }

  getPath() {
    return this.line.getPath();
  }

  remove() {
    this.staff.removeStaffLine(this);
    this.staff = null;
  }
}

export class Staff {
  readonly _lines: StaffLine[];

  constructor(lines: StaffLine[]) {
    this._lines = lines;
    this._lines.forEach(function(line) {
      line.staff = this;
    }.bind(this));
  }

  get lines(): StaffLine[] {
    return this._lines;
  }

  addLine(line: StaffLine): void {
    this._lines.push(line);
  }

  removeStaffLine(line: StaffLine): boolean {
    if (line) {
      const idx = this._lines.indexOf(line);
      if (idx >= 0) {
        this._lines.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  removeLine(line: Line): boolean {
    for (let idx = 0; idx < this._lines.length; idx++) {
      if (this._lines[idx].line === line) {
        this._lines.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  containsStaffLine(line: StaffLine): boolean {
    return this._lines.indexOf(line) >= 0;
  }

  containsLine(line: Line): boolean {
    for (let i = 0; i < this._lines.length; i++) {
      if (this._lines[i].line === line) {
        return true;
      }
    }
    return false;
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

  removeLine(line: Line): void {
    if (!line) {
      return;
    }

    for (let staff of this._staffs) {
      if (staff.removeLine(line)) {
        break;
      }
    }
  }

}
