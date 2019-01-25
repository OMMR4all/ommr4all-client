import {Region} from './region';
import {BlockType, EmptyRegionDefinition} from './definitions';
import {Point, PolyLine} from '../../geometry/geometry';
import {PageLine} from './pageLine';
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
    lines: Array<PageLine> = [],
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
      PageLine.fromJson(json, tr);  // drop capital has no lines
      return tr;
    } else {
      const tr = Block.create(
        parent,
        json.type,
        PolyLine.fromString(json.coords),
        [],
        json.id,
      );
      json.textLines.forEach(t => PageLine.fromJson(t, tr));
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
    mr.musicLines = json.musicLines.map(m => PageLine.fromJson(m, mr));
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

  isNotEmpty(flags = EmptyRegionDefinition.Default) {
    if ((flags & EmptyRegionDefinition.HasLines) && this.lines.length > 0) { return true; }  // tslint:disable-line no-bitwise
    return false;
  }

  isEmpty(flags = EmptyRegionDefinition.Default) {
    return !this.isNotEmpty(flags);
  }

  createLine(): PageLine {
    if (this.type === BlockType.Music) {
      return PageLine.createMusicLine(this);
    } else {
      return PageLine.createTextLine(this);
    }
  }

  get lines(): Array<PageLine> { return this._children as Array<PageLine>; }
  get page(): Page { return this.parent as Page; }

  // -----------------------------------------------------------
  // MusicLines
  // -----------------------------------------------------------

  get musicLines(): Array<PageLine> { return this._children as Array<PageLine>; }
  set musicLines(staffEquivs: Array<PageLine>) { this._children = staffEquivs; }

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

  addMusicLine(musicLine: PageLine) {
    this.attachChild(musicLine);
  }

  removeMusicLine(musicLine: PageLine): boolean {
    if (musicLine.parent !== this) { return false; }
    this.detachChild(musicLine);
    return true;
  }

  closestMusicLineToPoint(p: Point): PageLine {
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
  get textLines(): Array<PageLine> { return this._children as Array<PageLine>; }

  syllableById(id: string): Syllable {
    for (const tl of this.textLines) {
      const s = tl.syllableById(id);
      if (s) { return s; }
    }
    return null;
  }

  syllableInfoById(id: string): {s: Syllable, l: PageLine} {
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

  createTextLine(): PageLine {
    const tl = PageLine.createTextLine(this);
    return tl;
  }

}
