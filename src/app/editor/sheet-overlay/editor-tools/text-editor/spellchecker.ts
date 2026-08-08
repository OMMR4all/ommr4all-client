import {levenshtein} from '../../../../utils/levenshtein';

export class SimpleSpellChecker {
  private words: Set<string>;
  private wordList: string[] = [];

  constructor(words: string[]) {
    this.wordList = words;
    this.words = new Set(words.map(w => w.toLowerCase()));
  }

  check(word: string): boolean {
    if (!word) { return true; }
    return this.words.has(word.toLowerCase());
  }

  getSuggestions(word: string, maxSuggestions = 5): string[] {
    const target = word.toLowerCase();
    return this.wordList
      .map(w => ({ word: w, distance: levenshtein(target, w.toLowerCase()) }))
      .filter(item => item.distance <= 2)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxSuggestions)
      .map(item => item.word);
  }
}
