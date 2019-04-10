import {Syllable} from './syllable';
import {IdGenerator, IdType} from './id-generator';
import {SyllableConnectionType} from './definitions';
import {ReadingOrder} from './reading-order';

export class Sentence {
  constructor(
    private readonly _syllables = new Array<Syllable>(),
  ) {}

  get syllables() { return this._syllables; }
  set syllables(s: Array<Syllable>) { this._syllables.length = 0; this._syllables.push(...s); }

  hasSyllable(syllable: Syllable) {
    return this._syllables.indexOf(syllable) >= 0;
  }

  refreshIds() {
    this.syllables.forEach(s => s.refreshIds());
  }

  equals(s: Sentence) {
    if (s.syllables.length !== this.syllables.length) { return false; }
    for (let i = 0; i < this.syllables.length; i++) {
      if (!this.syllables[i].equals(s.syllables[i])) { return false; }
    }

    return true;
  }

  get text() {
    let t = '';
    this.syllables.forEach(s => {
      if (s.connection === SyllableConnectionType.New) {
        if (t.length === 0) {
          t += s.text;
        } else {
          t += ' ' + s.text;
        }
      } else if (s.connection === SyllableConnectionType.Visible) {
        t += '~' + s.text;
      } else {
        t += '-' + s.text;
      }
    });
    return t;
  }

  copyfromJson(json) {
    this.syllables = json.syllables.map(s => Syllable.fromJson(s));
  }

  toJson() {
    return {
      syllables: this.syllables.map(s => s.toJson())
    };
  }

  static textToSyllables(text: string): Array<Syllable> {
    const syllables = new Array<Syllable>();
    let currentSyllable = null;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '-') {
        currentSyllable = new Syllable();
        currentSyllable.connection = SyllableConnectionType.Hidden;
        syllables.push(currentSyllable);
      } else if (c === '~') {
        currentSyllable = new Syllable();
        currentSyllable.connection = SyllableConnectionType.Visible;
        syllables.push(currentSyllable);
      } else if (c === ' ') {
        currentSyllable = new Syllable();
        currentSyllable.connection = SyllableConnectionType.New;
        syllables.push(currentSyllable);
      } else {
        if (!currentSyllable) {
          currentSyllable = new Syllable();
          currentSyllable.connection = SyllableConnectionType.New;
          syllables.push(currentSyllable);
        }
        currentSyllable.text += c;
      }
    }
    return syllables;
  }
}
