import {SyllableConnectionType} from './definitions';

export class Syllable {
  constructor(
    public text = '',
    public connection = SyllableConnectionType.New,
    public dropCapitalLength = 0,
  ) {}

  static fromJson(json) {
    return new Syllable(
      json.text,
      json.connection,
    );
  }

  toJson() {
    return {
      text: this.text,
      connection: this.connection,
      dropCapitalLength: this.dropCapitalLength,
    };
  }
}
