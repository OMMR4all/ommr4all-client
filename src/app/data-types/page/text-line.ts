import {PolyLine} from '../../geometry/geometry';
import {TextEquiv} from './text-equiv';
import {Syllable} from './syllable';
import {Region} from './region';
import {TextRegion} from './text-region';
import {TextEquivContainer, TextEquivIndex} from './definitions';

export class Word {
  public syllabels: Array<Syllable> = [];

  static createByText(word) {
    word

  }

  toJson() {
    return {
      syllables: this.syllabels.map(s => s.toJson())
    };
  }
}

export class TextLine extends Region implements TextEquivContainer {
  public textEquivs: Array<TextEquiv> = [];
  public words: Array<Word> = [];

  static create(
    textRegion: TextRegion,
    coords = new PolyLine([]),
    textEquivs: Array<TextEquiv> = [],
    words: Array<Word> = [],
  ) {
    const tl = new TextLine();
    tl.coords = coords;
    tl.textEquivs = textEquivs;
    tl.words = words;
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
      words: this.words.map(w => w.toJson()),
    };
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
}
