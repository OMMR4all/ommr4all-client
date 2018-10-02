import {PolyLine, Rect} from 'src/app/geometry/geometry';
import {StaffEquiv} from './staff-equiv';

export class StaffLine {
  readonly  _AABB = new Rect();
  private _staff: StaffEquiv;

  constructor(
    staff: StaffEquiv,
    public coords = new PolyLine([]),
  ) {
    this.attach(staff);
    this.updateSorting();
  }

  static fromJson(json, staffEquiv: StaffEquiv): StaffLine {
    const line = new StaffLine(
      staffEquiv,
      PolyLine.fromString(json.coords),
    );
    line.updateAABB();
    return line;
  }

  toJson() {
    return {
      coords: this.coords.toString(),
    };
  }

  updateAABB() {
    this._AABB.copyFrom(this.coords.aabb());
  }

  updateSorting() {
    this.coords.sort((a, b) => a.x - b.x);
  }

  attach(staff: StaffEquiv) {
    if (staff === this._staff) { return; }
    this.detach();
    if (staff) {
      this._staff = staff;
      this._staff.addStaffLine(this);
    }
  }

  detach() {
    if (this._staff) {
      this._staff.removeStaffLine(this);
      this._staff = null;
    }
  }

  getPath() {
    return this.coords.getPath();
  }

  get staff() {
    return this._staff;
  }

  get AABB() {
    return this._AABB;
  }
}
