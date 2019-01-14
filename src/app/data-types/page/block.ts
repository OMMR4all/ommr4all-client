import {Region} from './region';
import {BlockType, EmptyMusicRegionDefinition, EmptyTextRegionDefinition} from './definitions';
import {Point, PolyLine} from '../../geometry/geometry';
import {Line} from './line';
import {IdType} from './id-generator';
import {Syllable} from './syllable';
import {Page} from './page';
import {Note} from './music-region/symbol';

export class Block extends Region {
  public type = BlockType.Music;

  constructor(
    coords = new PolyLine([]),
  ) {
    super(IdType.Block);
    this.coords = coords;
  }

  static create(
    parent: Page,
    type: BlockType,
    coords = new PolyLine([]),
    lines: Array<Line> = [],
    id = '',
  ) {
    const block = new Block(coords);
    block.type = type;
    lines.forEach(tl => block.attachChild(tl));
    block._id = id;
    parent.attachChild(block);
    return block;

  }

  static textBlockFromJson(parent: Page, json) {
    if (json.type === BlockType.DropCapital) {
      const tr = Block.create(
        parent,
        json.type,
      );
      Line.fromJson(json, tr);  // drop capital has no lines
      return tr;
    } else {
      const tr = Block.create(
        parent,
        json.type,
        PolyLine.fromString(json.coords),
        [],
        json.id,
      );
      json.textLines.forEach(t => Line.fromJson(t, tr));
      return tr;
    }
  }
  static musicBlockFromJson(parent: Page, json) {
    const mr = Block.create(
      parent,
      BlockType.Music,
      PolyLine.fromString(json.coords),
      [],
      json.id,
    );
    mr.musicLines = json.musicLines.map(m => Line.fromJson(m, mr));
    return mr;
  }

  toJson() {
    if (this.type === BlockType.Music) {
      return {
        id: this._id,
        coords: this.coords.toString(),
        musicLines: this.musicLines.map(m => m.toJson()),
      };
    } else {
      if (this.type === BlockType.DropCapital) {
        if (this.textLines.length === 0) {
          return {
            id: this.id,
            type: this.type,
          };
        } else {
          const json = this.textLines[0].toTextLineJson();
          json['type'] = this.type;
          return json;
        }
      } else {
        return {
          id: this.id,
          type: this.type,
          coords: this.coords.toString(),
          textLines: this.textLines.map(t => t.toJson()),
        };
      }
    }
  }

  isNotEmpty(mrFlags = EmptyMusicRegionDefinition.Default, trFlags = EmptyTextRegionDefinition.Default) {
    if (this.type === BlockType.Music) {
      if ((mrFlags & EmptyMusicRegionDefinition.HasDimension) && this.coords.points.length > 0) { return true; }  // tslint:disable-line no-bitwise max-line-length
      return this.musicLines.length > 0;
    } else {
      if ((trFlags & EmptyTextRegionDefinition.HasDimension) && (this.coords.points.length > 0 || this.AABB.area > 0)) { return true; }  // tslint:disable-line no-bitwise max-line-length
      if ((trFlags & EmptyTextRegionDefinition.HasTextLines) && this.textLines.length > 0) { return true; } // tslint:disable-line no-bitwise max-line-length
      return false;
    }
  }

  isEmpty(mrFlags = EmptyMusicRegionDefinition.Default, trFlags = EmptyTextRegionDefinition.Default) {
    return !this.isNotEmpty(mrFlags, trFlags);
  }

  clean(mrFlags = EmptyMusicRegionDefinition.Default, trFlags = EmptyTextRegionDefinition.Default) {
    this.textLines.forEach(tl => { tl.clean(); });
    this.textLines.filter(tl => tl.isTextLineEmpty(trFlags));
  }

  createLine(): Line {
    if (this.type === BlockType.Music) {
      return Line.createMusicLine(this);
    } else {
      return Line.createTextLine(this);
    }
  }
  // -----------------------------------------------------------
  // MusicLines
  // -----------------------------------------------------------

  get musicLines(): Array<Line> { return this._children as Array<Line>; }
  set musicLines(staffEquivs: Array<Line>) { this._children = staffEquivs; }

  noteById(id: string, mustExist = true): Note {
    for (const ml of this.musicLines) {
      const n = ml.getNotes().find(note => note.id === id);
      if (n) { return n; }
    }

    if (mustExist) {
      console.error('Could not find note with ID "' + id + '" in any music line: ' + this.musicLines);
    }

    return null;
  }

  addMusicLine(musicLine: Line) {
    this.attachChild(musicLine);
  }

  removeMusicLine(musicLine: Line): boolean {
    if (musicLine.parent !== this) { return false; }
    this.detachChild(musicLine);
    return true;
  }

  closestMusicLineToPoint(p: Point): Line {
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


  // -----------------------------------------------------------
  // MusicLines
  // -----------------------------------------------------------

  getRegion() { return this; }
  get textLines(): Array<Line> { return this._children as Array<Line>; }

  syllableById(id: string): Syllable {
    for (const tl of this.textLines) {
      const s = tl.syllableById(id);
      if (s) { return s; }
    }
    return null;
  }

  syllableInfoById(id: string): {s: Syllable, l: Line} {
    for (const tl of this.textLines) {
      const s = tl.syllableById(id);
      if (s) { return {s: s, l: tl}; }
    }
    return null;
  }

  _resolveCrossRefs(page: Page) {
  }

  cleanSyllables(): void {
    this.textLines.forEach(tl => tl.cleanSyllables());
  }

  createTextLine(): Line {
    const tl = Line.createTextLine(this);
    return tl;
  }

}
