import {Syllable} from './syllable';
import {IdGenerator, IdType} from './id-generator';
import {SyllableConnectionType} from './definitions';

export class Sentence {
  constructor(
    private _words = new Array<Word>(),
  ) {}

  get words() { return this._words; }

  merge(newSentence: Sentence) {
    if (this._words.length === 0) { this._words = newSentence._words; return; }

    let minWords = Math.min(this._words.length, newSentence._words.length);
    let startWords = 0;
    for (; startWords < minWords; startWords++) {
      if (this._words[startWords].text !== newSentence._words[startWords].text) {
        break;
      }
    }

    let endWords = 0;
    minWords -= startWords;
    for (; endWords < minWords; ++endWords) {
      if (this._words[this._words.length - endWords - 1].text !== newSentence._words[newSentence._words.length - endWords - 1].text) {
        break;
      }
    }
    console.log('Words start', startWords, 'end', endWords);

    const startWord = {this: this._words[startWords], new: newSentence._words[startWords]};
    const endWord = {this: this._words[this._words.length - endWords - 1], new: newSentence._words[newSentence._words.length - endWords - 1]};

    let startSyllables = -1;
    let endSyllables = -1;
    if (startWord.this && startWord.new) {
      const maxSyllables = Math.min(startWord.this.syllabels.length, startWord.new.syllabels.length);
      for (startSyllables = 0; startSyllables < maxSyllables; startSyllables++) {
        if (startWord.this.syllabels[startSyllables].text !== startWord.new.syllabels[startSyllables].text) {
          break;
        }
      }
    }
    if (endWord.this && endWord.new) {
      const maxSyllables = Math.min(endWord.this.syllabels.length, endWord.new.syllabels.length);
      for (endSyllables = 0; endSyllables < maxSyllables; endSyllables++) {
        if (endWord.this.syllabels[endWord.this.syllabels.length - endSyllables - 1].text !== endWord.new.syllabels[endWord.new.syllabels.length - endSyllables - 1].text) {
          break;
        }
      }
    }

    console.log('Syllables start', startSyllables, 'end', endSyllables);

    // remove all words between start and end
    const deletedSyllabes = new Array<Syllable>();
    if (startWord.new === endWord.new) {
      // for simplicity: drop this words and insert start words
      this._words.slice(startWords, this._words.length - endWords).forEach(w => deletedSyllabes.push(...w.syllabels));
      this._words.splice(startWords, this._words.length - endWords - startWords, endWord.new);
    } else {
      this._words.slice(startWords, this._words.length - endWords).forEach(w => deletedSyllabes.push(...w.syllabels));
      this._words.splice(startWords, this._words.length - endWords - startWords, ...newSentence._words.slice(startWords, newSentence._words.length - endWords));
    }
    console.log('out', this.text);
    console.log('deleted', deletedSyllabes);
    return {'deleted': deletedSyllabes};
  }

  get text() {
    let s = '';
    if (this._words.length === 0) { return s; }
    s += this._words[0].text;
    for (let i = 1; i < this._words.length; i++) {
      s += ' ' + this._words[i].text;
    }

    return s;
  }

  static textToWordsAndSyllables(text: string): Array<Word> {
    const words = [new Word()];
    let currentSyllable = new Syllable();
    currentSyllable.connection = SyllableConnectionType.New;
    words[0].syllabels.push(currentSyllable);
    let connection = true;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '-') {
        currentSyllable = new Syllable();
        currentSyllable.connection = SyllableConnectionType.Hidden;
        words[words.length - 1].syllabels.push(currentSyllable);
        connection = true;
      } else if (c === '~') {
        currentSyllable = new Syllable();
        currentSyllable.connection = SyllableConnectionType.Visible;
        words[words.length - 1].syllabels.push(currentSyllable);
        connection = true;
      } else if (c === ' ') {
        if (connection) {
          // skip
        } else {
          // new word
          words.push(new Word());
          currentSyllable = new Syllable();
          words[words.length - 1].syllabels.push(currentSyllable);
          currentSyllable.connection = SyllableConnectionType.New;
        }
      } else {
        currentSyllable.text += c;
        connection = false;
      }
    }
    return words;
  }
}

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
  get text() {
    let t = '';
    this.syllabels.forEach(s => {
      if (s.connection === SyllableConnectionType.New) {
        t += s.text;
      } else if (s.connection === SyllableConnectionType.Visible) {
        t += '~' + s.text;
      } else {
        t += '-' + s.text;
      }
    });
    return t;
  }

  refreshIds() {
    this._id = IdGenerator.newId(IdType.Word);
    this.syllabels.forEach(s => s.refreshIds());
  }
}

