import {PolyLine} from '../../geometry/geometry';
import {TextLine} from './text-line';
import {TextEquiv} from './text-equiv';
import {Page} from './page';
import {Syllable} from './syllable';

export enum TextRegionType {
  Paragraph = 0,
  Heading = 1,
  Lyrics = 2,
}

export class TextRegion {
  constructor(
    public type = TextRegionType.Paragraph,
    public coords = new PolyLine([]),
    public textLines: Array<TextLine> = [],
    public textEquivs: Array<TextEquiv> = [],
  ) {}

  static fromJson(json) {
    return new TextRegion(
      json.type,
      PolyLine.fromJSON(json.coords),
      json.textLines.map(t => TextLine.fromJson(t)),
      json.textEquivs.map(t => TextEquiv.fromJson(t)),
    );
  }

  toJson() {
    return {
      type: this.type,
      coords: this.coords.toJSON(),
      textLines: this.textLines.map(t => t.toJson()),
      textEquivs: this.textEquivs.map(t => t.toJson()),
    };
  }

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
}
