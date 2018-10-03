import {PolyLine} from '../../../geometry/geometry';
import {StaffEquiv} from './staff-equiv';
import {EquivIndex} from '../definitions';

export class MusicRegion {
  constructor(
    public coords = new PolyLine([]),
    public staffsEquivs: Array<StaffEquiv> = [],
  ) {}

  static fromJson(json) {
    return new MusicRegion(
      PolyLine.fromString(json.coords),
      json.staffEquivs.map(s => StaffEquiv.fromJson(s)),
    );
  }

  toJson() {
    return {
      coords: this.coords.toString(),
      staffEquivs: this.staffsEquivs.map(s => s.toJson()),
    };
  }

  _resolveCrossRefs(page) {
    this.staffsEquivs.forEach(s => s._resolveCrossRefs(page));
  }

  getOrCreateStaffEquiv(index: EquivIndex): StaffEquiv {
    let s = this.staffsEquivs.find(q => q.index === index);
    if (s) { return s; }
    s = new StaffEquiv(
      new PolyLine([]),
      [],
      [],
      index,
    );
    this.staffsEquivs.push(s);
    return s;
  }

  setStaffEquiv(staff: StaffEquiv) {
    this.removeStaffEquiv(staff.index);
    this.staffsEquivs.push(staff);
  }

  removeStaffEquiv(index: EquivIndex): boolean {
    const idx = this.staffsEquivs.findIndex(q => q.index === index);
    if (idx >= 0) { this.staffsEquivs.splice(idx, 1); return true; }
    return false;
  }

  clean() {
    this.staffsEquivs.forEach(s => s.clean());
    this.staffsEquivs = this.staffsEquivs.filter(s => !s.isEmpty());
  }

  isEmpty() {
    return this.staffsEquivs.length === 0 && this.coords.points.length === 0;
  }
}
