import {PolyLine} from '../../../geometry/geometry';
import {StaffEquiv} from './staff-equiv';
import {EmptyMusicRegionDefinition, StaffEquivIndex} from '../definitions';
import {Region} from '../region';

export class MusicRegion extends Region {
  constructor(
    coords = new PolyLine([]),
    staffsEquivs: Array<StaffEquiv> = [],
  ) {
    super();
    this.coords = coords;
    this.staffEquivs = staffsEquivs;
  }

  static fromJson(json) {
    const mr = new MusicRegion(
      PolyLine.fromString(json.coords),
    );
    mr.staffEquivs = json.staffEquivs.map(s => StaffEquiv.fromJson(s, mr));
    return mr;
  }

  toJson() {
    return {
      coords: this.coords.toString(),
      staffEquivs: this.staffEquivs.map(s => s.toJson()),
    };
  }

  get staffEquivs(): Array<StaffEquiv> { return this._children as Array<StaffEquiv>; }
  set staffEquivs(staffEquivs: Array<StaffEquiv>) { this._children = staffEquivs; }

  _resolveCrossRefs(page) {
    this.staffEquivs.forEach(s => s._resolveCrossRefs(page));
  }

  getOrCreateStaffEquiv(index = StaffEquivIndex.Default): StaffEquiv {
    let s = this.staffEquivs.find(q => q.index === index);
    if (s) { return s; }
    s = StaffEquiv.create(
      this,
      new PolyLine([]),
      [],
      [],
      index,
    );
    return s;
  }

  setStaffEquiv(staff: StaffEquiv) {
    this.removeStaffEquiv(staff.index);
    staff.attachToParent(this);
  }

  removeStaffEquiv(index = StaffEquivIndex.Default): boolean {
    const idx = this.staffEquivs.findIndex(q => q.index === index);
    if (idx >= 0) { this.staffEquivs[idx].detachFromParent(); return true; }
    return false;
  }

  clean(flags = EmptyMusicRegionDefinition.Default) {
    this.staffEquivs.forEach(s => s.clean());
    this.staffEquivs = this.staffEquivs.filter(s => !s.isEmpty(flags));
  }

  isNotEmpty(flags = EmptyMusicRegionDefinition.Default) {
    if ((flags & EmptyMusicRegionDefinition.HasDimension) && this.coords.points.length > 0) { return true; }
    return this.staffEquivs.length > 0;
  }

  isEmpty(flags = EmptyMusicRegionDefinition.Default){
    return !this.isNotEmpty(flags);
  }
}
