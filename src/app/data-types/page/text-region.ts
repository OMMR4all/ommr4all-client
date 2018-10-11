import {PolyLine} from '../../geometry/geometry';
import {TextLine} from './text-line';
import {TextEquiv} from './text-equiv';
import {Page} from './page';
import {Syllable} from './syllable';
import {ɵisListLikeIterable} from '@angular/core';
import {Region} from './region';

export enum TextRegionType {
  Paragraph = 0,
  Heading = 1,
  Lyrics = 2,
  DropCapital = 3,
}

export class TextRegion extends Region {
  constructor(
    public type = TextRegionType.Paragraph,
    coords = new PolyLine([]),
    textLines: Array<TextLine> = [],
    public textEquivs: Array<TextEquiv> = [],
  ) {
    super();
    this.coords = coords;
  }

  static fromJson(json) {
    return new TextRegion(
      json.type,
      PolyLine.fromString(json.coords),
      json.textLines.map(t => TextLine.fromJson(t)),
      json.textEquivs.map(t => TextEquiv.fromJson(t)),
    );
  }

  toJson() {
    return {
      type: this.type,
      coords: this.coords.toString(),
      textLines: this.textLines.map(t => t.toJson()),
      textEquivs: this.textEquivs.map(t => t.toJson()),
    };
  }

  get textLines(): Array<TextLine> { return this._children as Array<TextLine>; }
  set textLines(textLines: Array<TextLine>) { this._children = textLines; }

  _resolveCrossRefs(page: Page) {
  }

  syllableById(id: string): Syllable {
    if (this.type !== TextRegionType.Lyrics) {
      return null;
    }

    for (const t of this.textEquivs) {
      const r = t.syllableById(id); if (r) { return r; }
    }

    for (const t of this.textLines) {
      const r = t.syllableById(id); if (r) { return r; }
    }

    return null;
  }

  createTextLine(): TextLine {
    const tl = new TextLine();
    this.textLines.push(tl);
    return tl;
  }
}
