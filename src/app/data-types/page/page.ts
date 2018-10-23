import {TextRegion, TextRegionType} from './text-region';
import {MusicRegion} from './music-region/music-region';
import {Syllable} from './syllable';
import {Point, PolyLine, Rect} from '../../geometry/geometry';
import {MusicLine} from './music-region/music-line';
import {StaffLine} from './music-region/staff-line';
import {EmptyMusicRegionDefinition, StaffEquivIndex, TextEquivContainer} from './definitions';
import {Region} from './region';
import {ReadingOrder} from './reading-order';
import {Annotations} from './annotations';

export class Page {
  private _readingOrder = new ReadingOrder(this);
  private _annotations = new Annotations(this);

  constructor(
    public textRegions: Array<TextRegion> = [],
    public musicRegions: Array<MusicRegion> = [],
    public imageFilename = '',
    public imageHeight = 0,
    public imageWidth = 0,
  ) {}

  static fromJson(json) {
    const page = new Page(
      json.textRegions.map(t => TextRegion.fromJson(t)),
      json.musicRegions.map(m => MusicRegion.fromJson(m)),
      json.imageFilename,
      json.imageHeight,
      json.imageWidth,
    );
    page._readingOrder = ReadingOrder.fromJson(json.readingOrder, page);
    page._annotations = Annotations.fromJson(json.annotations, page);
    page._resolveCrossRefs();

    return page;
  }

  toJson() {
    return {
      textRegions: this.textRegions.map(t => t.toJson()),
      musicRegions: this.musicRegions.map(m => m.toJson()),
      imageFilename: this.imageFilename,
      imageWidth: this.imageWidth,
      imageHeight: this.imageHeight,
      readingOrder: this._readingOrder.toJson(),
      annotations: this._annotations.toJson(),
    };
  }

  get readingOrder() { return this._readingOrder; }
  get annotations() { return this._annotations; }

  _prepareRender() {
    this.textRegions.forEach(tr => {tr._prepareRender(); tr.update(); });
    this.musicRegions.forEach(mr => {mr._prepareRender(); mr.update(); });
  }

  textEquivContainerById(id: string): TextEquivContainer {
    for (const tr of this.textRegions) {
      if (tr.id === id) { return tr as TextEquivContainer; }
      for (const tl of tr.textLines) {
        if (tl.id === id) { return tl as TextEquivContainer; }
      }
    }
    return null;
  }

  _resolveCrossRefs() {
    this.textRegions.forEach(t => t._resolveCrossRefs(this));
    this.musicRegions.forEach(m => m._resolveCrossRefs(this));
  }


  refreshIds() {
    this.textRegions.forEach(tr => tr.refreshIds());
    this.musicRegions.forEach(mr => mr.refreshIds());
  }

  clean() {
    this.cleanMusicRegions();
    this.cleanTextRegions();
  }

  cleanMusicRegions(flags = EmptyMusicRegionDefinition.Default) {
    this.musicRegions.forEach(m => m.clean(flags));
    this.musicRegions = this.musicRegions.filter(m => !m.isEmpty(flags));
  }

  cleanTextRegions() {
    this.textRegions.forEach(tr => tr.clean());
    this.textRegions = this.textRegions.filter(t => !t.isEmpty());
  }

  addNewMusicRegion(): MusicRegion {
    const m = new MusicRegion();
    this.musicRegions.push(m);
    return m;
  }

  musicRegionById(id: string): MusicRegion {
    return this.musicRegions.find(r => r.id === id);
  }

  textRegionById(id: string): TextRegion {
    return this.textRegions.find(r => r.id === id);
  }

  addTextRegion(type: TextRegionType): TextRegion {
    const t = TextRegion.create(type);
    this.textRegions.push(t);
    return t;
  }

  removeCoords(coords: PolyLine) {
    for (const mr of this.musicRegions) {
      if (mr.coords === coords) {
        this.musicRegions.splice(this.musicRegions.indexOf(mr), 1);
        return;
      }
      for (const se of mr.musicLines) {
        if (se.coords === coords) {
          mr.musicLines.splice(mr.musicLines.indexOf(se), 1);
          return;
        }
      }
    }

    for (const tr of this.textRegions) {
      if (tr.coords === coords) {
        console.log(this.textRegions.indexOf(tr));
        this.textRegions.splice(this.textRegions.indexOf(tr), 1);
        return;
      }
      for (const tl of tr.textLines) {
        if (tl.coords === coords) {
          tr.textLines.splice(tr.textLines.indexOf(tl), 1);
          return;
        }
      }
    }

    console.warn('Cannot find polyline');
  }

  closestMusicRegionToPoint(p: Point): MusicRegion {
    if (this.musicRegions.length === 0) {
      return null;
    }
    let bestMusicRegion = this.musicRegions[0];
    let bestDistSqr = bestMusicRegion.distanceSqrToPoint(p);
    for (let i = 1; i < this.musicRegions.length; i++) {
      const mr = this.musicRegions[i];
      const d = mr.distanceSqrToPoint(p);
      if (d < bestDistSqr) {
        bestDistSqr = d;
        bestMusicRegion = mr;
      }
    }
    if (bestDistSqr >= 1e8) {
      return null;
    }
    return bestMusicRegion;
  }

  closestRegionToPoint(p: Point): Region {
    if (this.musicRegions.length === 0 && this.textRegions.length === 0) {
      return null;
    }
    let closestD = 1e8;
    let closestR = [];

    [...this.musicRegions, ...this.textRegions].forEach(mr => {
      if (mr.AABB.tl().y > p.y) {
        const newD = mr.AABB.tl().y - p.y;
        if (newD === closestD) {
          closestR.push(mr);
        } else if (newD < closestD) {
          closestR = [mr];
          closestD = newD;
        }
      } else if (mr.AABB.bl().y < p.y) {
        const newD = p.y - mr.AABB.bl().y;
        if (newD === closestD) {
          closestR.push(mr);
        } else if (newD < closestD) {
          closestR = [mr];
          closestD = newD;
        }
      } else {
        if (0 === closestD) {
          closestR.push(mr);
        } else {
          closestR = [mr];
          closestD = 0;
        }
      }
      });
    if (closestR.length === 0) { return null; }

    let bestR: Region = closestR[0];
    let bestDistSqr = bestR.distanceSqrToPoint(p);
    for (let i = 1; i < closestR.length; i++) {
      const r = closestR[i];
      const d = r.distanceSqrToPoint(p);
      if (d < bestDistSqr) {
        bestDistSqr = d;
        bestR = r;
      }
    }
    return bestR;
  }

  listLinesInRect(rect: Rect): StaffLine[] {
    const outLines: StaffLine[] = [];
    for (const music of this.musicRegions) {
      music.musicLines.forEach(ml => {
        if (ml.AABB.intersetcsWithRect(rect)) {
          for (const staffLine of ml.staffLines) {
            if (staffLine.AABB.intersetcsWithRect(rect)) {
              if (staffLine.coords.intersectsWithRect(rect)) {
                outLines.push(staffLine);
              }
            }
          }
        }
      });
    }
    return outLines;
  }

  staffLinePointsInRect(rect: Rect): Array<Point> {
    const points = [];
    for (const music of this.musicRegions) {
      music.musicLines.forEach(ml => {
        if (ml.AABB.intersetcsWithRect(rect)) {
          for (const staffLine of ml.staffLines) {
            if (staffLine.AABB.intersetcsWithRect(rect)) {
              for (const point of staffLine.coords.points) {
                if (rect.containsPoint(point)) {
                  points.push(point);
                }
              }
            }
          }
        }
      });
    }
    return points;
  }

  regionByCoords(coords: PolyLine): Region {
    if (!coords) { return null; }
    for (const mr of this.musicRegions) {
      const r = mr.regionByCoords(coords);
      if (r) { return r; }
    }
    for (const tr of this.textRegions) {
      const r = tr.regionByCoords(coords);
      if (r) { return r; }
    }
    return null;
  }

  polylineDifference(polyLine: PolyLine): PolyLine {
    const pl = polyLine.copy();
    const rect = pl.aabb();
    this.musicRegions.forEach(mr => {
      if (mr.AABB.intersetcsWithRect(rect)) {
        mr.musicLines.forEach(ml => {
          if (ml.AABB.intersetcsWithRect(rect)) {
            if (ml.coords !== polyLine) {
              pl.moveRef(pl.difference(ml.coords));
            }
          }
        });
      }
    });
    this.textRegions.forEach(tr => {
      if (tr.AABB.intersetcsWithRect(rect)) {
        if (tr.typeAllowsTextLines()) {
          tr.textLines.forEach(tl => {
            if (tl.AABB.intersetcsWithRect(rect)) {
              if (tl.coords !== polyLine) {
                pl.moveRef(pl.difference(tl.coords));
              }
            }
          });
        } else {
          if (tr.coords !== polyLine) {
            pl.moveRef(pl.difference(tr.coords));
          }
        }
      }
    });
    return pl;
  }
}
