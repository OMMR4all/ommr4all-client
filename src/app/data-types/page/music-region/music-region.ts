import {PolyLine} from '../../../geometry/geometry';
import {StaffEquiv} from './staff-equiv';

export class MusicRegion {
  constructor(
    public coords = new PolyLine([]),
    public staffs: Array<StaffEquiv> = [],
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
      staffEquivs: this.staffs.map(s => s.toJson()),
    };
  }

  _resolveCrossRefs(page) {
    this.staffs.forEach(s => s._resolveCrossRefs(page));
  }
}
