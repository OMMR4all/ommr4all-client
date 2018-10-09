import {PolyLine} from '../../geometry/geometry';
import {TextEquiv} from './text-equiv';
import {Syllable} from './syllable';

export class TextLine {
  constructor(
    public coords = new PolyLine([]),
    public textEquivs: Array<TextEquiv> = [],
  ) {}

  static fromJson(json) {
    return new TextLine(
      PolyLine.fromString(json.coords),
      json.textEquivs.map(t => TextEquiv.fromJson(t)),
    );
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
