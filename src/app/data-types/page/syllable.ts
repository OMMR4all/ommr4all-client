import {SyllableConnectionType} from './definitions';

export class Syllable {
  constructor(
    public id: string,
    public text = '',
    public connection = SyllableConnectionType.New,
  ) {}

  static fromJson(json) {
    return new Syllable(
      json.id,
      json.text,
      json.connection,
    );
  }

  toJson() {
    return {
      id: this.id,
      text: this.text,
      connection: this.connection,
    };
  }
}
