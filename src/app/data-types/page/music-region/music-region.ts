import {PolyLine} from '../../../geometry/geometry';
import {StaffEquiv} from './staff-equiv';
import {EmptyMusicRegionDefinition, StaffEquivIndex} from '../definitions';

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

  getOrCreateStaffEquiv(index = StaffEquivIndex.Default): StaffEquiv {
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

  removeStaffEquiv(index = StaffEquivIndex.Default): boolean {
    const idx = this.staffsEquivs.findIndex(q => q.index === index);
    if (idx >= 0) { this.staffsEquivs.splice(idx, 1); return true; }
    return false;
  }

  clean(flags = EmptyMusicRegionDefinition.Default) {
    this.staffsEquivs.forEach(s => s.clean());
    this.staffsEquivs = this.staffsEquivs.filter(s => !s.isEmpty(flags));
  }

  isNotEmpty(flags = EmptyMusicRegionDefinition.Default) {
    if ((flags & EmptyMusicRegionDefinition.HasDimension) && this.coords.points.length > 0) { return true; }
    return this.staffsEquivs.length > 0;
  }

  isEmpty(flags = EmptyMusicRegionDefinition.Default){
    return !this.isNotEmpty(flags);
  }
}
