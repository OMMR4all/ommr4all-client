import { Rect } from '../geometry/geometry';
import { Staff } from './StaffLine';
import {Symbol, SymbolType} from './symbol';

export class LyricsSyllable {
  private _container: LyricsContainer;
  text: string;
  start: number;
  end: number;
  center: number;
  note: Symbol;

  static fromJSON(syllable) {

  }

  toJSON() {
    return {
      text: this.text,
      start: this.start,
      end: this.end,
      center: this.center,
      note: this.note,
    };
  }

  constructor(container: LyricsContainer, note: Symbol) {
    this._container = container;
    this.note = note;
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

  nextSyllable(current: LyricsSyllable): LyricsSyllable {
    if (this._syllables.length === 0) {return null;}
    if (!current) {return this._syllables[0];}
    const idx = this._syllables.indexOf(current);
    if (idx < 0) {return null;}
    if (idx + 1 === this._syllables.length) {return null;}
    return this._syllables[idx + 1];
  }

  prevSyllable(current: LyricsSyllable): LyricsSyllable {
    if (this._syllables.length === 0) {return null;}
    if (!current) {return this._syllables[this._syllables.length - 1];}
    const idx = this._syllables.indexOf(current);
    if (idx <= 0) {return null;}
    return this._syllables[idx - 1];
  }

  update() {
    if (this.aabb.area === 0) {
      return;
    }

    // at least one syllable (may be with empty text) must exist
    // checks if all notes are assigned to one syllable, else add to the nearest (e. g. new note added)

    const notes = this._staff.symbolList.filter(SymbolType.Note);
    notes.sort((a: Symbol, b: Symbol) => a.position.x - b.position.x);
    if (this._syllables.length === 0 && notes.length > 0) {
      for (let i = 0; i < notes.length; i++) {
        const s = new LyricsSyllable(this, notes[i]);
        s.text = '';
        s.note = notes[i];
        s.center = notes[i].position.x;
        if (i === 0) {
          s.start = this.aabb.origin.x;
        } else {
          s.start = (s.center + notes[i - 1].position.x) / 2;
        }
        if (i === notes.length - 1) {
          s.end = this.aabb.tr().x;
        } else {
          s.end = (s.center + notes[i + 1].position.x) / 2;
        }

        this._syllables.push(s);
      }
    }
  }
}
