import {Page} from './page';
import {PolyLine} from '../../geometry/geometry';
import {BlockType, TextEquivIndex} from './definitions';
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
  ) {
  }

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


  _insertIntoLyrics(region: PageLine) {
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

  _updateLyrics() {
    this._lyricsReadingOrder = [];

    this._page.textRegions.filter(tr => tr.type === BlockType.Lyrics || tr.type === BlockType.DropCapital).forEach(r => {
      r.textLines.forEach(tl => this._insertIntoLyrics(tl));
    });
  }

  centerPoints(): PolyLine {
    this._updateLyrics();  // TODO: cache!
    const pl = new PolyLine([]);
    this._lyricsReadingOrder.forEach(r => {
      pl.points.push(r.AABB.center());
    });
    return pl;
  }

  generateSyllables(cleanup = true): Array<Syllable> {
    const syllables = [];
    let dropCapitalText = '';
    this._lyricsReadingOrder.forEach(l => {
        const tr = ReadingOrder._parentTextRegion(l);
        if (tr.type !== BlockType.Music) {
          const tl = l;
          if (dropCapitalText.length > 0) {
            // prepend drop capital text
            tl.sentence.words[0].syllables[0].dropCapitalLength = dropCapitalText.length;
            tl.sentence.words[0].syllables[0].text = dropCapitalText + tl.sentence.words[0].syllables[0].text;
          }
          dropCapitalText = '';
          tl.sentence.words.forEach(w => w.syllables.filter(s => s.text.length > 0).forEach(s => syllables.push(s)));
        } else {
          console.warn('Invalid TextRegionType in reading order!');
        }
      }
    );

    return syllables;
  }
}
