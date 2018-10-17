import {Syllable} from './syllable';
import {IdGenerator, IdType} from './id-generator';

export class Word {
  public syllabels: Array<Syllable> = [];
  private _id = IdGenerator.newId(IdType.Word);

  static fromJson(json) {
    const w = new Word();
    w._id = json.id;
    w.syllabels = json.syllables.map(s => Syllable.fromJson(s));
    return w;
  }

  toJson() {
    return {
      id: this._id,
      syllables: this.syllabels.map(s => s.toJson())
    };
  }

  get id() { return this._id; }

  refreshIds() {
    this._id = IdGenerator.newId(IdType.Word);
    this.syllabels.forEach(s => s.refreshIds());
  }
}

