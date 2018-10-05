import {StaffEquivIndex, SyllableConnectionType, TextEquivIndex} from './definitions';
import {Syllable } from './syllable';

export class TextEquiv {
  constructor(
    public id,
    public syllables: Array<Syllable> = [],
    public index = TextEquivIndex.OCR_GroundTruth,
  ) {}

  static fromJson(json) {
    return new TextEquiv(
      json.id,
      json.content,
      json.index,
    );
  }

  toJson() {
    return {
      id: this.id,
      content: this.getSyllableText(),
      index: this.index,
    };
  }

  syllableById(id) {
    for (const s of this.syllables) {
      if (s.id === id) {
        return s;
      }
    }
    return null;
  }


  getSyllableText() {
    if (this.syllables.length === 0) { return ''; }
    let out = '';
    for (const s of this.syllables) {
      out += s.text;
      if (s.connection === SyllableConnectionType.New) {
        out += ' ';
      } else if (s.connection === SyllableConnectionType.Visible) {
        out += '~';
      } else if (s.connection === SyllableConnectionType.Hidden) {
        out += '-';
      }
    }
  }
}
