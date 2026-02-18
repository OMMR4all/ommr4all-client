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
      .map(w => ({ word: w, distance: this.levenshtein(target, w.toLowerCase()) }))
      .filter(item => item.distance <= 2)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxSuggestions)
      .map(item => item.word);
  }

  private levenshtein(a: string, b: string): number {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) { tmp[i] = [i]; }
    for (let j = 0; j <= b.length; j++) { tmp[0][j] = j; }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1, tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return tmp[a.length][b.length];
  }
}
