import {BookCommunication, PageCommunication} from '../../../../../../data-types/communication';


export class WordFrequency {
  constructor(
       public word = '',
       public frequency = 0,

    public hyphenated = '',
  ) {
  }


  static fromJson(json) {
    return new WordFrequency(
      json.word,
      json.frequency,
      json.hyphenated,
    );
  }

  toJson() {
    return {
      word: this.word,
      frequency: this.frequency,
      hyphenated: this.hyphenated,
    };
  }
}
export class WordFrequencyDict {
  constructor(
       public freq_list: WordFrequency[] = []
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

  findByWord(word: string) {
    return this.freq_list.find(element => element.word === word);
  }
}

export class DatabaseDictionary {
  constructor(
       public p_id = '',
    public name = '',
    public created = new Date(Date.now()).toISOString(),
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
