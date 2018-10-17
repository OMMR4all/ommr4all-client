import {PolyLine} from '../../geometry/geometry';
import {TextEquiv} from './text-equiv';
import {Syllable} from './syllable';
import {Region} from './region';
import {TextRegion} from './text-region';
import {TextEquivContainer, TextEquivIndex} from './definitions';
import {IdGenerator, IdType} from './id-generator';
import {Word} from './word';

export class TextLine extends Region implements TextEquivContainer {
  public textEquivs: Array<TextEquiv> = [];
  public words: Array<Word> = [];

  static create(
    textRegion: TextRegion,
    coords = new PolyLine([]),
    textEquivs: Array<TextEquiv> = [],
    words: Array<Word> = [],
    id = '',
  ) {
    const tl = new TextLine();
    tl.coords = coords;
    tl.textEquivs = textEquivs;
    tl.words = words;
    tl.attachToParent(textRegion);
    tl._id = id;
    return tl;
  }

  static fromJson(json, textRegion: TextRegion) {
    return TextLine.create(
      textRegion,
      PolyLine.fromString(json.coords),
      json.textEquivs.map(t => TextEquiv.fromJson(t)),
      json.words.map(w => Word.fromJson(w)),
      json.id,
    );
  }

  private constructor() {
    super(IdType.TextLine);
  }

  toJson() {
    return {
      id: this.id,
      coords: this.coords.toString(),
      textEquivs: this.textEquivs.map(t => t.toJson()),
      words: this.words.map(w => w.toJson()),
    };
  }

  syllableById(id: string): Syllable {
    for (const w of this.words) {
      const s = w.syllabels.find(s => s.id === id);
      if (s) { return s; }
    }
    return null;
  }

  getRegion() { return this; }
  get textRegion() { return this.parent as TextRegion; }

  cleanSyllables(): void {
    this.words = [];
  }

  getOrCreateTextEquiv(index: TextEquivIndex) {
    for (const te of this.textEquivs) {
      if (te.index === index) { return te; }
    }
    const t = new TextEquiv('', index);
    this.textEquivs.push(t);
    return t;
  }

  isEmpty() {
    return this.textEquivs.length === 0 && this.AABB.area === 0;
  }

  refreshIds() {
    super.refreshIds();
    this.words.forEach(w => w.refreshIds());
    this.textEquivs.forEach(te => te.refreshId());
  }
}
