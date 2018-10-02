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
}
