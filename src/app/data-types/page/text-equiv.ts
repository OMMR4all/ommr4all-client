import {SyllableConnectionType, TextEquivIndex} from './definitions';
import {Syllable} from './syllable';
import {Sentence} from './sentence';
import {IdGenerator, IdType} from './id-generator';

export class TextEquiv {
  constructor(
    public content = '',
    public index = TextEquivIndex.OCR_GroundTruth,
    private _id = IdGenerator.newId(IdType.TextEquiv),
  ) {}

  static fromJson(json) {
    return new TextEquiv(
      json.content,
      json.index,
      json.id,
    );
  }

  toJson() {
    return {
      content: this.content,
      index: this.index,
      id: this._id,
    };
  }

  refreshId() { this._id = IdGenerator.newId(IdType.TextEquiv); }


  get visibleText() {
    return this.content.replace(new RegExp('-', 'g'), '');
  }

  toWords(): Array<Sentence> {
    const words = [new Sentence()];
    let currentSyllable = new Syllable();
    currentSyllable.connection = SyllableConnectionType.New;
    words[0].syllables.push(currentSyllable);
    let connection = true;
    for (let i = 0; i < this.content.length; i++) {
      const c = this.content[i];
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
        if (connection) {
          // skip
        } else {
          // new word
          words.push(new Sentence());
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
