import { Rect } from '../geometry/geometry';
import { Staff } from './StaffLine';
import {Symbol, SymbolType} from './symbol';

export class LyricsSyllable {
  private _container: LyricsContainer;
  text: string;
  start: number;
  end: number;
  center: number;
  notes: Symbol[] = [];

  static fromJSON(syllable) {

  }

  toJSON() {
    return {
      text: this.text,
      start: this.start,
      end: this.end,
      center: this.center,
      notes: this.notes.map(function (note) {
        // TODO: id!!!
        return note;
      })
    };
  }

  constructor(container: LyricsContainer) {
    this._container = container;
  }
}

export class LyricsContainer {
  private _aabb: Rect;
  readonly _staff: Staff;
  readonly _syllables: LyricsSyllable[];


  static fromJSON(lyrics, staff: Staff) {
    return new LyricsContainer(staff);
  }

  toJSON() {
    return {
      aabb: this._aabb.toJSON(),
      syllables: this._syllables.map(function (syllable) {
        return syllable.toJSON();
      })
    };
  }

  constructor(staff: Staff, rect: Rect = new Rect(), syillables: LyricsSyllable[] = []) {
    this._staff = staff;
    this._aabb = rect;
    this._syllables = syillables;
  }

  get staff(): Staff {
    return this._staff;
  }

  get aabb(): Rect {
    return this._aabb;
  }

  set aabb(rect: Rect) {
    this._aabb = rect;
  }

  get syllables() {
    return this._syllables;
  }

  update() {
    if (this.aabb.area === 0) {
      return;
    }

    // at least one syllable (may be with empty text) must exist
    // checks if all notes are assigned to one syllable, else add to the nearest (e. g. new note added)

    const notes = this._staff.symbolList.filter(SymbolType.Note);
    if (this._syllables.length === 0 && notes.length > 0) {
      const s = new LyricsSyllable(this);
      s.start = this.aabb.origin.x;
      s.end = s.start + this.aabb.size.w;
      s.center = (s.start + s.end) / 2;
      s.text = '';
      s.notes.push(notes[0]);
      if (notes.length > 1) {
        s.end = (notes[0].position.x + notes[1].position.x) / 2;
        s.center = notes[0].position.x;
      }
      this._syllables.push(s);
    }
  }
}
