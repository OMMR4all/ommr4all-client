import {SyllableConnectionType} from './definitions';
import {IdGenerator, IdType} from './id-generator';

export class Syllable {
  private static readonly conToPrefix = ['~', '-', ''];
  private static readonly conToVisiblePrefix = ['~', '', ''];

  constructor(
    public text = '',
    public connection = SyllableConnectionType.New,
    public prefix = '',  // drop-capital
    private _id = IdGenerator.newId(IdType.Syllable),
  ) {
    if (!this.prefix) { this.prefix = ''; }
    if (!this._id) { this._id = IdGenerator.newId(IdType.Syllable); }
  }

  static fromJson(json) {
    return new Syllable(
      json.text.substring(json.dropCapitalLength),
      json.connection,
      json.text.substring(0, json.dropCapitalLength),
      json.id,
    );
  }

  toJson() {
    return {
      text: this.prefix + this.text,
      connection: this.connection,
      dropCapitalLength: this.prefix.length,
      id: this._id,
    };
  }

  get connectionStr() { return Syllable.conToPrefix[this.connection]; }
  get visibleText() { return Syllable.conToVisiblePrefix[this.connection] + this.prefix + this.text; }

  get id() { return this._id; }

  refreshIds() {
    this._id = IdGenerator.newId(IdType.Syllable);
  }

  copyFrom(o: Syllable) {
    this.text = o.text;
    this.connection = o.connection;
    this.prefix = o.prefix;
  }

  equals(o: Syllable): boolean { return this.text === o.text && this.connection === o.connection && this.prefix === o.prefix; }
}
