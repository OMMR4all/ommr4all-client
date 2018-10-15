import {Page} from './page';
import {TextRegionType} from './text-region';
import {Region} from './region';
import {PolyLine} from '../../geometry/geometry';
import {TextEquivContainer} from './definitions';

export class ReadingOrder {
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
}
