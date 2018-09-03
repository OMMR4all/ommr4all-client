import {Rect} from '../geometry/geometry';
import {Staff} from './StaffLine';
import {Symbol, SymbolType} from './symbol';

export enum SyllableConnectionType {
  CONNECTION,
  VISIBLE_CONNECTION,
  SPACE,
}

export class LyricsSyllable {
  private _container: LyricsContainer;
  text = '';
  note: Symbol;
  _previousSyllable: LyricsSyllable;
  _nextSyllable: LyricsSyllable;
  connection: SyllableConnectionType;

  static fromJSON(syllable, container: LyricsContainer) {
    return new LyricsSyllable(container, container._staff.symbolList._symbols[syllable.noteIdx], syllable.connection);
  }

  toJSON() {
    return {
      text: this.text,
      noteIdx: this._container._staff.symbolList._symbols.indexOf(this.note),
      connection: this.connection,
    };
  }

  constructor(container: LyricsContainer, note: Symbol, connection: SyllableConnectionType = SyllableConnectionType.SPACE) {
    this._container = container;
    this.note = note;
    this.connection = connection;
  }

  get start(): number {
    if (!this._previousSyllable) {
      return this._container.aabb.origin.x;
    } else {
      return (this.center + this._previousSyllable.center) / 2;
    }
  }

  get end(): number {
    if (!this._nextSyllable) {
      return this._container.aabb.tr().x;
    } else {
      return (this.center + this._nextSyllable.center) / 2;
    }
  }

  get center(): number {
    return this.note.position.x;
  }
}

export class LyricsContainer {
  private _aabb: Rect;
  readonly _staff: Staff;
  readonly _syllables: LyricsSyllable[];


  static fromJSON(lyrics, staff: Staff) {
    if (!lyrics) {
      return new LyricsContainer(staff);
    }
    return new LyricsContainer(staff, Rect.fromJSON(lyrics.aabb));
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
    this.update();
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

  noteAdded(note: Symbol) {
    if (note.type !== SymbolType.Note) { return; }
    this._syllables.push(new LyricsSyllable(this, note));
    this._updateSyllables();
  }

  noteRemoved(note: Symbol) {
    if (note.type !== SymbolType.Note) { return; }
    const idx = this._syllables.findIndex((value: LyricsSyllable): boolean => value.note === note);
    this._syllables.splice(idx, 1);
    this._updateSyllables();
  }

  nextSyllable(current: LyricsSyllable): LyricsSyllable {
    if (this._syllables.length === 0) { return null; }
    if (!current) { return this._syllables[0]; }
    const idx = this._syllables.indexOf(current);
    if (idx < 0) { return null; }
    if (idx + 1 === this._syllables.length) { return null; }
    return this._syllables[idx + 1];
  }

  prevSyllable(current: LyricsSyllable): LyricsSyllable {
    if (this._syllables.length === 0) { return null; }
    if (!current) { return this._syllables[this._syllables.length - 1]; }
    const idx = this._syllables.indexOf(current);
    if (idx <= 0) { return null; }
    return this._syllables[idx - 1];
  }

  update() {
    const notes = this._staff.symbolList.filter(SymbolType.Note);
    for (const note of notes) {
      const idx = this._syllables.findIndex((value: LyricsSyllable): boolean => value.note === note);
      if (idx < 0) {
        // not existing note
        this._syllables.push(new LyricsSyllable(this, note));
      }
    }

    for (let i = 0; i < this._syllables.length; i++) {
      const syllable = this._syllables[i];
      const idx = notes.findIndex((note: Symbol): boolean => note === syllable.note);
      if (idx < 0) {
        this._syllables.splice(i, 1);
        i--;
      }
    }

    this._updateSyllables();
  }


  private _updateSyllables() {
    this._syllables.sort((a: LyricsSyllable, b: LyricsSyllable) => a.center - b.center);
    for (let i = 0; i < this._syllables.length; i++) {
      if (i === 0) {
        this._syllables[i]._previousSyllable = null;
      } else {
        this._syllables[i]._previousSyllable = this._syllables[i - 1];
      }

      if (i === this._syllables.length - 1) {
        this._syllables[i]._nextSyllable = null;
      } else {
        this._syllables[i]._nextSyllable = this._syllables[i + 1];
      }
    }
  }
}
