import {Syllable} from './syllable';
import {SyllableConnectionType} from './definitions';

export class Sentence {


  constructor(
    private readonly _syllables = new Array<Syllable>(),
  ) {}



  get syllables() { return this._syllables; }
  set syllables(s: Array<Syllable>) { this._syllables.length = 0; this._syllables.push(...s); }

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
  static fromJson(json) {
    if (!json) { return new Sentence(); }
    return new Sentence(
      json.syllables ? json.syllables.map(s => Syllable.fromJson(s)) : [],

    );
  }

  static textToSyllables(text: string): Array<Syllable> {
    // always start with a 'new' syllable even tough it might be empty.
    // a possible drop capital expects a new syllable
    // during assignment, empty syllables are ignored
    let currentSyllable = new Syllable('', SyllableConnectionType.New);
    const syllables = new Array<Syllable>(currentSyllable);
    // tslint:disable-next-line:prefer-for-of
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

  toJson() {
    return {
      syllables: this._syllables.map(s => s.toJson()),
    };
  }

  copyfromJson(json) {
    this.syllables = json.syllables.map(s => Syllable.fromJson(s));
  }

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
}
