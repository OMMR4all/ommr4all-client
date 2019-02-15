import {Syllable} from './syllable';
import {IdGenerator, IdType} from './id-generator';
import {SyllableConnectionType} from './definitions';

export class Sentence {
  constructor(
    private _words = new Array<Word>(),
  ) {}

  get words() { return this._words; }
  set words(words: Array<Word>) { this._words.length = 0; this._words.push(...words); }

  get text() {
    let s = '';
    if (this._words.length === 0) { return s; }
    s += this._words[0].text;
    for (let i = 1; i < this._words.length; i++) {
      s += ' ' + this._words[i].text;
    }

    return s;
  }

  static textToWordsAndSyllables(text: string): Array<Word> {
    const words = [new Word()];
    let currentSyllable = new Syllable();
    currentSyllable.connection = SyllableConnectionType.New;
    words[0].syllables.push(currentSyllable);
    let connection = true;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '-') {
        currentSyllable = new Syllable();
        currentSyllable.connection = SyllableConnectionType.Hidden;
        words[words.length - 1].syllables.push(currentSyllable);
        connection = true;
      } else if (c === '~') {
        currentSyllable = new Syllable();
        currentSyllable.connection = SyllableConnectionType.Visible;
        words[words.length - 1].syllables.push(currentSyllable);
        connection = true;
      } else if (c === ' ') {
        /* if (connection) {
          // skip
        } else */ {
          // new word
          words.push(new Word());
          currentSyllable = new Syllable();
          words[words.length - 1].syllables.push(currentSyllable);
          currentSyllable.connection = SyllableConnectionType.New;
        }
      } else {
        currentSyllable.text += c;
        connection = false;
      }
    }
    return words;
  }
}

export class Word {
  public syllables: Array<Syllable> = [];
  private _id = IdGenerator.newId(IdType.Word);

  static fromJson(json) {
    const w = new Word();
    w._id = json.id;
    w.syllables = json.syllables.map(s => Syllable.fromJson(s));
    return w;
  }

  toJson() {
    return {
      id: this._id,
      syllables: this.syllables.map(s => s.toJson())
    };
  }

  get id() { return this._id; }
  get text() {
    let t = '';
    this.syllables.forEach(s => {
      if (s.connection === SyllableConnectionType.New) {
        t += s.text;
      } else if (s.connection === SyllableConnectionType.Visible) {
        t += '~' + s.text;
      } else {
        t += '-' + s.text;
      }
    });
    return t;
  }

  refreshIds() {
    this._id = IdGenerator.newId(IdType.Word);
    this.syllables.forEach(s => s.refreshIds());
  }

  equals(w: Word) {
    if (w.syllables.length !== this.syllables.length) { return false; }
    for (let i = 0; i < this.syllables.length; i++) {
      if (!this.syllables[i].equals(w.syllables[i])) { return false; }
    }

    return true;
  }
}

