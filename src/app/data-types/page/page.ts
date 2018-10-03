import {TextRegion, TextRegionType} from './text-region';
import {MusicRegion} from './music-region/music-region';
import {Syllable} from './syllable';
import {EquivIndex} from './definitions';
import {Point, Rect} from '../../geometry/geometry';
import {StaffEquiv} from './music-region/staff-equiv';
import {StaffLine} from './music-region/staff-line';

export class Page {
  constructor(
    public textRegions: Array<TextRegion> = [],
    public musicRegions: Array<MusicRegion> = [],
    public imageFilename = '',
    public imageHeight = 0,
    public imageWidth = 0
  ) {}

  static fromJson(json) {
    const page = new Page(
      json.textRegions.map(t => TextRegion.fromJson(t)),
      json.musicRegions.map(m => MusicRegion.fromJson(m)),
      json.imageFilename,
      json.imageHeight,
      json.imageWidth,
    );
    page._resolveCrossRefs();
    return page;
  }

  syllableById(id): Syllable {
    for (const t of this.textRegions) {
      const r = t.syllableById(id);
      if (r) { return r; }
    }
    return null;
  }

  _resolveCrossRefs() {
    this.textRegions.forEach(t => t._resolveCrossRefs(this));
    this.musicRegions.forEach(m => m._resolveCrossRefs(this));
  }

  toJson() {
    return {
      textRegions: this.textRegions.map(t => t.toJson()),
      musicRegions: this.musicRegions.map(m => m.toJson()),
      imageFilename: this.imageFilename,
      imageWidth: this.imageWidth,
      imageHeight: this.imageHeight,
    };
  }

  clean() {
    this.musicRegions.forEach(m => m.clean());
    this.musicRegions = this.musicRegions.filter(m => !m.isEmpty());

  }

  addNewMusicRegion(): MusicRegion {
    const m = new MusicRegion();
    this.musicRegions.push(m);
    return m;
  }

  setStaffEquivs(staffs: Array<StaffEquiv>, index: EquivIndex) {
    this.musicRegions.forEach(m => m.removeStaffEquiv(index));
    staffs.forEach(s => {
      s.index = index;
      const mr = this.addNewMusicRegion();
      mr.setStaffEquiv(s);
    });
    this.clean();
  }

  removeStaffEquivs(index: EquivIndex) {
    this.musicRegions.forEach(m => m.removeStaffEquiv(index));
  }

  addTextRegion(type: TextRegionType): TextRegion {
    const t = new TextRegion(type);
    this.textRegions.push(t);
    return t;
  }

  closestStaffEquivToPoint(p: Point, index: EquivIndex): StaffEquiv {
    if (this.musicRegions.length === 0) {
      return null;
    }
    let bestStaff = this.musicRegions[0].getOrCreateStaffEquiv(index);
    let bestDistSqr = bestStaff.distanceSqrToPoint(p);
    for (let i = 1; i < this.musicRegions.length; i++) {
      const staff = this.musicRegions[i].getOrCreateStaffEquiv(index);
      const d = staff.distanceSqrToPoint(p);
      if (d < bestDistSqr) {
        bestDistSqr = d;
        bestStaff = staff;
      }
    }
    if (bestDistSqr >= 10e8) {
      return null;
    }
    return bestStaff;
  }

  listLinesInRect(rect: Rect, index: EquivIndex): StaffLine[] {
    const outLines: StaffLine[] = [];
    for (const music of this.musicRegions) {
      const staff = music.getOrCreateStaffEquiv(index);
      if (staff.AABB.intersetcsWithRect(rect)) {
        for (const staffLine of staff.staffLines) {
          if (staffLine.AABB.intersetcsWithRect(rect)) {
            if (staffLine.coords.intersectsWithRect(rect)) {
              outLines.push(staffLine);
            }
          }
        }
      }
    }
    return outLines;
  }

  staffLinePointsInRect(rect: Rect, index: EquivIndex): Array<Point> {
    const points = [];
    for (const music of this.musicRegions) {
      const staff = music.getOrCreateStaffEquiv(index);
      if (staff.AABB.intersetcsWithRect(rect)) {
        for (const staffLine of staff.staffLines) {
          if (staffLine.AABB.intersetcsWithRect(rect)) {
            for (const point of staffLine.coords.points) {
              if (rect.containsPoint(point)) {
                points.push(point);
              }
            }
          }
        }
      }
    }
    return points;
  }

}
