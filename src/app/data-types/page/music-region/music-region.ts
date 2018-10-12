import {Point, PolyLine} from '../../../geometry/geometry';
import {MusicLine} from './music-line';
import {EmptyMusicRegionDefinition, StaffEquivIndex} from '../definitions';
import {Region} from '../region';

export class MusicRegion extends Region {
  constructor(
    coords = new PolyLine([]),
    musicLines: Array<MusicLine> = [],
  ) {
    super();
    this.coords = coords;
    this.musicLines = musicLines;
  }

  static fromJson(json) {
    const mr = new MusicRegion(
      PolyLine.fromString(json.coords),
    );
    mr.musicLines = json.musicLines.map(m => MusicLine.fromJson(m, mr));
    return mr;
  }

  toJson() {
    return {
      coords: this.coords.toString(),
      musicLines: this.musicLines.map(m => m.toJson()),
    };
  }

  get musicLines(): Array<MusicLine> { return this._children as Array<MusicLine>; }
  set musicLines(staffEquivs: Array<MusicLine>) { this._children = staffEquivs; }

  _resolveCrossRefs(page) {
    this.musicLines.forEach(s => s._resolveCrossRefs(page));
  }

  createMusicLine(): MusicLine {
    return MusicLine.create(
      this,
      new PolyLine([]),
      [],
      [],
    );
  }

  addMusicLine(musicLine: MusicLine) {
    this.attachChild(musicLine);
  }

  removeMusicLine(musicLine: MusicLine): boolean {
    if (musicLine.parent !== this) { return false; }
    this.detachChild(musicLine);
    return true;
  }

  closestMusicLineToPoint(p: Point): MusicLine {
    if (this.musicLines.length === 0) {
      return null;
    }
    let bestMusicLine = this.musicLines[0];
    let bestDistSqr = bestMusicLine.distanceSqrToPoint(p);
    for (let i = 1; i < this.musicLines.length; i++) {
      const mr = this.musicLines[i];
      const d = mr.distanceSqrToPoint(p);
      if (d < bestDistSqr) {
        bestDistSqr = d;
        bestMusicLine = mr;
      }
    }
    if (bestDistSqr >= 1e8) {
      return null;
    }
    return bestMusicLine;
  }

  clean(flags = EmptyMusicRegionDefinition.Default) {
    this.musicLines.forEach(s => s.clean());
    this.musicLines = this.musicLines.filter(s => !s.isEmpty(flags));
  }

  isNotEmpty(flags = EmptyMusicRegionDefinition.Default) {
    if ((flags & EmptyMusicRegionDefinition.HasDimension) && this.coords.points.length > 0) { return true; }
    return this.musicLines.length > 0;
  }

  isEmpty(flags = EmptyMusicRegionDefinition.Default){
    return !this.isNotEmpty(flags);
  }
}
