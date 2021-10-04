import {BookCommunication, PageCommunication} from '../../../../../../data-types/communication';


export class WordFrequency {
  constructor(
    // tslint:disable-next-line:variable-name
    public word: string = '',
    // tslint:disable-next-line:variable-name
    public frequency: number = 0,
  ) {
  }


  static fromJson(json) {
    return new WordFrequency(
      json.word,
      json.frequency,
    );
  }

  toJson() {
    return {
      word: this.word,
      frequency: this.frequency,
    };
  }
}
export class WordFrequencyDict {
  constructor(
    // tslint:disable-next-line:variable-name
    public freq_list: Array<WordFrequency> = []
  ) {
  }
  static fromJson(json) {
    return new WordFrequencyDict(
      json.freq_list ? json.freq_list.map(d => WordFrequency.fromJson(d)) : [],
    );
  }

  toJson() {
    return {
      freq_list: this.freq_list.map(d => d.toJson()),
    };
  }
  addWord(word, frequency= 1) {
    this.freq_list.push(new WordFrequency(word, frequency));
  }


  removeWord(word: string) {
    const index = this.freq_list.findIndex((x) => x.word === word);
    this.freq_list.splice(index, 1);

  }
}

export class DatabaseDictionary {
  constructor(
    // tslint:disable-next-line:variable-name
    public p_id = '',
    public name = '',
    public created = new Date(Date.now()).toISOString(),
    // tslint:disable-next-line:variable-name
    public dictionary: WordFrequencyDict = new WordFrequencyDict()

  ) {
  }


  static fromJson(json) {
    return new DatabaseDictionary(
      json.p_id,
      json.name,
      json.created,
      WordFrequencyDict.fromJson(json.dictionary),
    );
  }

  toJson() {
    return {
      p_id: this.p_id,
      name: this.name,
      created: this.created,
      dictionary: this.dictionary.toJson(),

    };
  }

  public getWordList() {
    const wordList = [];
    for (const entry of this.dictionary.freq_list) {
      wordList.push(entry.word);
    }
    return wordList;
  }

}
