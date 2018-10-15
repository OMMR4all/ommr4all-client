import {StaffEquivIndex, SyllableConnectionType, TextEquivIndex} from './definitions';
import {Syllable } from './syllable';

export class TextEquiv {
  constructor(
    public content = '',
    public index = TextEquivIndex.OCR_GroundTruth,
  ) {}

  static fromJson(json) {
    return new TextEquiv(
      json.content,
      json.index,
    );
  }

  toJson() {
    return {
      content: this.content,
      index: this.index,
    };
  }

  get visibleText() {
    return this.content.replace(new RegExp('-', 'g'), '');
  }
}
