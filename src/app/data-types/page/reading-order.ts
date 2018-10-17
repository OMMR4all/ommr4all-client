import {Page} from './page';
import {TextRegion, TextRegionType} from './text-region';
import {PolyLine} from '../../geometry/geometry';
import {TextEquivContainer, TextEquivIndex} from './definitions';
import {Syllable} from './syllable';
import {TextLine} from './text-line';

export class ReadingOrder {
  private static _parentTextRegion(r: TextEquivContainer) {
    return r.getRegion().parentOfType(TextRegion) as TextRegion;
  }

  static fromJson(json, page: Page) {
    if (!json) { return new ReadingOrder(page); }
    return new ReadingOrder(
      page,
      json.lyricsReadingOrder.map(r => page.textEquivContainerById(r.id)),
    );
  }

  toJson() {
    return {
      lyricsReadingOrder: this._lyricsReadingOrder.map(t => t.id),
    };
  }

  constructor(
    private _page: Page,
    private _lyricsReadingOrder: Array<TextEquivContainer> = [],
  ) {
  }

  first() { return this._lyricsReadingOrder.length > 0 ? this._lyricsReadingOrder[0] : null; }
  last() { return this._lyricsReadingOrder.length > 0 ? this._lyricsReadingOrder[this._lyricsReadingOrder.length - 1] : null; }

  prev(r: TextEquivContainer) {
    const idx = this._lyricsReadingOrder.indexOf(r);
    if (idx < 0) { return; }
    if (idx === 0) { return this._lyricsReadingOrder[0]; }
    return this._lyricsReadingOrder[idx - 1];
  }

  next(r: TextEquivContainer) {
    const idx = this._lyricsReadingOrder.indexOf(r);
    if (idx < 0) { return; }
    if (idx >= this._lyricsReadingOrder.length - 1) { return this._lyricsReadingOrder[this._lyricsReadingOrder.length - 1]; }
    return this._lyricsReadingOrder[idx + 1];
  }


  _insertIntoLyrics(region: TextEquivContainer) {
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

    this._page.textRegions.filter(tr => tr.type === TextRegionType.Lyrics).forEach(r => {
      r.textLines.forEach(tl => this._insertIntoLyrics(tl));
    });

    this._page.textRegions.filter(tr => tr.type === TextRegionType.DropCapital).forEach(r => {
      this._insertIntoLyrics(r);
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
    this._page.textRegions.forEach(tr => tr.cleanSyllables());
    const syllables = [];
    let dropCapitalText = '';
    this._lyricsReadingOrder.forEach(l => {
        const tr = ReadingOrder._parentTextRegion(l);
        if (tr.type === TextRegionType.Lyrics) {
          const tl = l.getRegion().parentOfType(TextLine) as TextLine;
          tl.words = l.getOrCreateTextEquiv(TextEquivIndex.Syllables).toWords();
          if (dropCapitalText.length > 0) {
            // prepend drop capital text
            tl.words[0].syllabels[0].dropCapitalLength = dropCapitalText.length;
            tl.words[0].syllabels[0].text = dropCapitalText + tl.words[0].syllabels[0].text;
          }
          dropCapitalText = '';
          tl.words.forEach(w => w.syllabels.filter(s => s.text.length > 0).forEach(s => syllables.push(s)));
        } else if (tr.type === TextRegionType.DropCapital) {
          dropCapitalText += tr.getOrCreateTextEquiv(TextEquivIndex.Syllables).content;
        } else {
          console.warn('Invalid TextRegionType in reading order!');
        }
      }
    );

    return syllables;
  }
}
