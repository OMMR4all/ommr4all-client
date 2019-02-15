import {SyllableConnectionType} from './definitions';
import {IdGenerator, IdType} from './id-generator';

export class Syllable {
  private static readonly conToPrefix = ['~', '-', ''];

  constructor(
    public text = '',
    public connection = SyllableConnectionType.New,
    public dropCapitalLength = 0,
    private _id = IdGenerator.newId(IdType.Syllable),
  ) {
    if (!this.dropCapitalLength) { this.dropCapitalLength = 0; }
    if (!this._id) { this._id = IdGenerator.newId(IdType.Syllable); }
  }

  static fromJson(json) {
    return new Syllable(
      json.text,
      json.connection,
      json.dropCapitalLength,
      json.id,
    );
  }

  toJson() {
    return {
      text: this.text,
      connection: this.connection,
      dropCapitalLength: this.dropCapitalLength,
      id: this._id,
    };
  }

  get prefix() { return Syllable.conToPrefix[this.connection]; }

  get id() { return this._id; }

  refreshIds() {
    this._id = IdGenerator.newId(IdType.Syllable);
  }

  copyFrom(o: Syllable) {
    this.text = o.text;
    this.connection = o.connection;
    this.dropCapitalLength = o.dropCapitalLength;
  }

  equals(o: Syllable): boolean { return this.text === o.text && this.connection === o.connection && this.dropCapitalLength === o.dropCapitalLength; }
}
