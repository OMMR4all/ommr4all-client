import {Syllable} from './syllable';
import {IdGenerator, IdType} from './id-generator';

export class Word {
  public syllabels: Array<Syllable> = [];
  private _id = IdGenerator.newId(IdType.Word);

  toJson() {
    return {
      syllables: this.syllabels.map(s => s.toJson())
    };
  }

  get id() { return this._id; }

  refreshIds() {
    this._id = IdGenerator.newId(IdType.Word);
    this.syllabels.forEach(s => s.refreshIds());
  }
}

