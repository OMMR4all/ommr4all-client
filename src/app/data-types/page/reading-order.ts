import {Page} from './page';
import {PolyLine} from '../../geometry/geometry';
import {BlockType} from './definitions';
import {Syllable} from './syllable';
import {PageLine} from './pageLine';
import {Block} from './block';

export class ReadingOrder {
  private static _parentTextRegion(r: PageLine) {
    return r.parent as Block;
  }

  static fromJson(json, page: Page) {
    if (!json) { return new ReadingOrder(page); }
    return new ReadingOrder(
      page,
      json.lyricsReadingOrder.map(r => page.textLineById(r.id)),
    );
  }

  toJson() {
    return {
      lyricsReadingOrder: this._lyricsReadingOrder.map(t => t.id),
    };
  }

  constructor(
    private _page: Page,
    private _lyricsReadingOrder: Array<PageLine> = [],
    private _centerPoints = new PolyLine([]),
  ) {
  }

  get readingOrder() { return this._lyricsReadingOrder; }
  get centerPoints() { return this._centerPoints; }

  set readingOrder(ro: Array<PageLine>) { this._lyricsReadingOrder = ro; this._readingOrderChanged(); }

  first() { return this._lyricsReadingOrder.length > 0 ? this._lyricsReadingOrder[0] : null; }
  last() { return this._lyricsReadingOrder.length > 0 ? this._lyricsReadingOrder[this._lyricsReadingOrder.length - 1] : null; }

  prev(r: PageLine) {
    const idx = this._lyricsReadingOrder.indexOf(r);
    if (idx < 0) { return; }
    if (idx === 0) { return this._lyricsReadingOrder[0]; }
    return this._lyricsReadingOrder[idx - 1];
  }

  next(r: PageLine) {
    const idx = this._lyricsReadingOrder.indexOf(r);
    if (idx < 0) { return; }
    if (idx >= this._lyricsReadingOrder.length - 1) { return this._lyricsReadingOrder[this._lyricsReadingOrder.length - 1]; }
    return this._lyricsReadingOrder[idx + 1];
  }


  private _insertIntoLyrics(region: PageLine) {
    let i = 0;
    for (; i < this._lyricsReadingOrder.length; i++) {
      const r = this._lyricsReadingOrder[i];
      if (region.AABB.bottom < r.AABB.top) {
        break;
      } else if (region.AABB.top > r.AABB.bottom) {
      } else {
        if (region.AABB.left < r.AABB.left) {
          break;  // region is left
        }
      }
    }

    this._lyricsReadingOrder.splice(i, 0, region);
  }

  private _removeFromLyrics(line: PageLine) {
    const idx = this._lyricsReadingOrder.indexOf(line);
    if (idx < 0) { return; }
    this._lyricsReadingOrder.splice(idx, 1);
  }

  _updateReadingOrder(clean = false) {
    if (clean) { this._lyricsReadingOrder.length = 0; }
    const textLines = new Array<PageLine>();
    const newTextLines = [];


    this._page.textRegions.filter(tr => tr.type === BlockType.Lyrics || tr.type === BlockType.DropCapital).forEach(r => {
      newTextLines.push(...r.textLines.filter(tl => this._lyricsReadingOrder.indexOf(tl) < 0));
      textLines.push(...r.textLines);
    });

    const deletedTextLines = this._lyricsReadingOrder.filter(tl => textLines.indexOf(tl) < 0);

    deletedTextLines.forEach(l => this._removeFromLyrics(l));
    newTextLines.forEach(l => this._insertIntoLyrics(l));
    this._readingOrderChanged();
  }

  _readingOrderChanged() {
    this._centerPoints = new PolyLine(this._lyricsReadingOrder.map(r => r. AABB.center()));
  }

  generateSyllables(): Array<Syllable> {
    const syllables = [];
    this._lyricsReadingOrder.filter(lr => lr.blockType === BlockType.Lyrics)
      .forEach(l => syllables.push(...l.sentence.syllables.filter(s => s.visibleText.trim().length > 0)));
    return syllables;
  }
}
