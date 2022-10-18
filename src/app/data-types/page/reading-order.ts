import {Page} from './page';
import {Point, PolyLine, Rect, Size} from '../../geometry/geometry';
import {BlockType} from './definitions';
import {Syllable} from './syllable';
import {PageLine} from './pageLine';
import {Block} from './block';
import {median} from '../../utils/math';

export class ReadingOrder {
  private static _parentTextRegion(r: PageLine) {
    return r.parent as Block;
  }

  static fromJson(json, page: Page) {
    if (!json) { return new ReadingOrder(page); }
    return new ReadingOrder(
      page,
      json.lyricsReadingOrder.map(r => page.textLineById(r)).filter(r => !!r),
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


  private _insertIntoLyrics(region: PageLine, columns: Rect[]|undefined) {
    if (!columns) {
      columns = this._computeColumns();
    }
    const targetColumn = columns.find(c => c.intersetcsWithRect(region.AABB));
    if (!targetColumn) {
      this._lyricsReadingOrder.push(region);
      return;
    }

    let i = 0;
    for (; i < this._lyricsReadingOrder.length; i++) {
      const r = this._lyricsReadingOrder[i];
      if (r.AABB.noIntersectionWithRect(targetColumn)) {
        continue;
      }

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

  private _computeColumns(): Rect[] {
    const columns = [];
    this._page.musicRegions.forEach(mr => {
      const left = mr.AABB.left;
      const right = mr.AABB.right;
      const matchingColumns = columns.filter(c => c.left <= right && c.right >= left);
      columns.push({
        blocks: [].concat(...matchingColumns.map(c => c.blocks), mr),
        lines: [].concat(...matchingColumns.map(c => c.lines), ...mr.lines),
        left: Math.min(left, ...matchingColumns.map(c => c.left)),
        right: Math.max(right, ...matchingColumns.map(c => c.right)),
      });
      matchingColumns.forEach(c => columns.splice(columns.indexOf(c), 1));
    });
    return columns.sort((a, b) => a.left - b.left).map(c => {{}
      c.blocks.sort((a: Block, b) => a.AABB.top - b.AABB.top);
      const distances = [];
      for (let i = 1; i < c.blocks.length; i++) {
        distances.push(c.blocks[i].AABB.top - c.blocks[i - 1].AABB.bottom);
      }
      const avgTextLineHeight = median(distances);
      const top = Math.min(...c.blocks.map(b => b.AABB.top));
      const bot = Math.max(...c.blocks.map(b => b.AABB.bottom)) + avgTextLineHeight;
      return new Rect(new Point(
        c.left, top,
      ), new Size(c.right - c.left, bot - top));
    });
  }

  _updateReadingOrder(clean = false) {
    if (clean) { this._lyricsReadingOrder.length = 0; }
    const textLines = new Array<PageLine>();
    const newTextLines = new Array<PageLine>();

    const columns = this._computeColumns();
    //|| tr.type === BlockType.DropCapital
    this._page.textRegions.filter(tr => tr.type === BlockType.Lyrics ).forEach(r => {
      newTextLines.push(...r.textLines.filter(tl => this._lyricsReadingOrder.indexOf(tl) < 0));
      textLines.push(...r.textLines);
    });

    const deletedTextLines = this._lyricsReadingOrder.filter(tl => textLines.indexOf(tl) < 0);

    const newTextLinesInColumns = columns.map(
      c => newTextLines.filter(tl => tl.AABB.intersetcsWithRect(c))
    );

    // add unassigned text lines to the closest column
    const unassignedTextLines = newTextLines.filter(tl => !newTextLinesInColumns.map(c => c.includes(tl)).includes(true));
    unassignedTextLines.forEach(utl => {
      const center = utl.AABB.center();
      const closest = columns.map((c, i) => ({d: c.distanceSqrToPoint(center), c, i}));
      closest.sort((a, b) => a.d - b.d);
      newTextLinesInColumns[closest[0].i].push(utl);
    });

    deletedTextLines.forEach(l => this._removeFromLyrics(l));
    newTextLinesInColumns.forEach(c => c.forEach(l => this._insertIntoLyrics(l, columns)));
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
