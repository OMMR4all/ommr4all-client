import {PolyLine} from '../../geometry/geometry';
import {TextEquiv} from './text-equiv';
import {Syllable} from './syllable';
import {Region} from './region';
import {TextRegion} from './text-region';

export class TextLine extends Region {
  public textEquivs: Array<TextEquiv> = [];

  static create(
    textRegion: TextRegion,
    coords = new PolyLine([]),
    textEquivs: Array<TextEquiv> = [],
  ) {
    const tl = new TextLine();
    tl.coords = coords;
    tl.textEquivs = textEquivs;
    tl.attachToParent(textRegion);
    return tl;
  }

  static fromJson(json, textRegion: TextRegion) {
    return TextLine.create(
      textRegion,
      PolyLine.fromString(json.coords),
      json.textEquivs.map(t => TextEquiv.fromJson(t)),
    );
  }

  private constructor() {
    super();
  }

  toJson() {
    return {
      coords: this.coords.toString(),
      textEquivs: this.textEquivs.map(t => t.toJson()),
    };
  }

  syllableById(id: string): Syllable {
    for (const t of this.textEquivs) {
      const r = t.syllableById(id); if (r) { return r; }
    }
    return null;
  }
}
