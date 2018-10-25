import {PolyLine} from '../../geometry/geometry';
import {TextLine} from './text-line';
import {TextEquiv} from './text-equiv';
import {Page} from './page';
import {Syllable} from './syllable';
import {Region} from './region';
import {EmptyTextRegionDefinition, TextEquivContainer, TextEquivIndex} from './definitions';
import {IdType} from './id-generator';

export enum TextRegionType {
  Paragraph = 0,
  Heading = 1,
  Lyrics = 2,
  DropCapital = 3,
}

export class TextRegion extends Region implements TextEquivContainer {
  public type = TextRegionType.Paragraph;
  public textEquivs: Array<TextEquiv> = [];

  static create(
    type = TextRegionType.Paragraph,
    coords = new PolyLine([]),
    textLines: Array<TextLine> = [],
    textEquivs: Array<TextEquiv> = [],
    id = '',
  ) {
    const tr = new TextRegion();
    tr.type = type;
    tr.coords = coords;
    textLines.forEach(tl => tr.attachChild(tl));
    tr.textEquivs = textEquivs;
    tr._id = id;
    return tr;

  }
  private constructor() {
    super(IdType.TextRegion);
  }

  static fromJson(json) {
    const tr = TextRegion.create(
      json.type,
      PolyLine.fromString(json.coords),
      [],
      json.textEquivs.map(t => TextEquiv.fromJson(t)),
      json.id,
    );
    json.textLines.forEach(t => TextLine.fromJson(t, tr));

    return tr;
  }

  toJson() {
    return {
      id: this.id,
      type: this.type,
      coords: this.coords.toString(),
      textLines: this.textLines.map(t => t.toJson()),
      textEquivs: this.textEquivs.map(t => t.toJson()),
    };
  }

  getRegion() { return this; }
  get textLines(): Array<TextLine> { return this._children as Array<TextLine>; }

  typeAllowsTextLines() { return this.type !== TextRegionType.DropCapital; }

  syllableById(id: string): Syllable {
    for (const tl of this.textLines) {
      const s = tl.syllableById(id);
      if (s) { return s; }
    }
    return null;
  }

  syllableInfoById(id: string): {s: Syllable, l: TextLine} {
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

  createTextLine(): TextLine {
    const tl = TextLine.create(this);
    return tl;
  }

  getOrCreateTextEquiv(index: TextEquivIndex) {
    for (const te of this.textEquivs) {
      if (te.index === index) { return te; }
    }
    const t = new TextEquiv('', index);
    this.textEquivs.push(t);
    return t;
  }

  clean(flags = EmptyTextRegionDefinition.Default) {
    this.textEquivs = this.textEquivs.filter(te => te.content.length > 0);
    this.textLines.forEach(tl => { tl.clean(); });
    this.textLines.filter(tl => tl.isEmpty(flags));
  }

  isNotEmpty(flags = EmptyTextRegionDefinition.Default) {
    if ((flags & EmptyTextRegionDefinition.HasDimension) && (this.coords.points.length > 0 || this.AABB.area > 0)) { return true; }  // tslint:disable-line no-bitwise max-line-length
    if ((flags & EmptyTextRegionDefinition.HasTextLines) && this.textLines.length > 0) { return true; } // tslint:disable-line no-bitwise max-line-length
    if ((flags & EmptyTextRegionDefinition.HasText) && this.textEquivs.length > 0) { return true; }     // tslint:disable-line no-bitwise max-line-length
    return false;
  }

  isEmpty(flags = EmptyTextRegionDefinition.Default) {
    return !this.isNotEmpty(flags);
  }

  refreshIds() {
    super.refreshIds();
    this.textEquivs.forEach(te => te.refreshId());
  }
}
