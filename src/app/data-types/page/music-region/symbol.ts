import {AccidentalType, ClefType, GraphicalConnectionType, MusicSymbolPositionInStaff, NoteType, SymbolType} from '../definitions';
import {Point} from 'src/app/geometry/geometry';
import {Syllable} from '../syllable';
import {IdGenerator, IdType} from '../id-generator';
import {PageLine} from '../pageLine';

type MusicLine = PageLine;

export abstract class Symbol {
  protected _staff: MusicLine;
  private _staffPositionOffset = 0;
  readonly _coord = new Point(0, 0);
  readonly _snappedCoord = new Point(0, 0);

  static fromType(type: SymbolType) {
    if (type === SymbolType.Note) {
      return new Note(null);
    } else if (type === SymbolType.Clef) {
      return new Clef(null);
    } else if (type === SymbolType.Accid) {
      return new Accidental(null);
    } else {
      console.error('Unimplemented symbol type' + type);
    }

  }

  static fromJson(json, staff: MusicLine = null) {
    if (json.symbol === SymbolType.Note) {
      return Note.fromJson(json, staff);
    } else if (json.symbol === SymbolType.Accid) {
      return Accidental.fromJson(json, staff);
    } else if (json.symbol === SymbolType.Clef) {
      return Clef.fromJson(json, staff);
    } else {
      console.error('Unimplemented symbol type: ' + json.symbol + ' of json ' + json);
    }

  }

  static symbolsFromJson(json, staff: MusicLine = null): Array<Symbol> {
    const symbols = [];
    json.map(s => {
      if (s.symbol === SymbolType.Note) {
        const nc = s.nc;
        for (let i = 0; i < nc.length; i++) {
          if (i === 0) {
            // set id to first note (marks neume start)
            nc[i].id = s.id.replace('neume', 'note');
            nc[i].isNeumeStart = true;
          } else {
            nc[i].id = nc[0].id + '_nc' + i;
            nc[i].isNeumeStart = false;
          }
          symbols.push(Note.fromJson(nc[i], staff));
        }
      } else {
        symbols.push(Symbol.fromJson(s, staff));
      }
    });
    return symbols;
  }

  constructor(
    staff: MusicLine,
    public readonly symbol: SymbolType,
    coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    private _id = '',
    public fixedSorting = false,
  ) {
    this.attach(staff);
    if (positionInStaff !== MusicSymbolPositionInStaff.Undefined && !coord.isZero()) {
      this.staffPositionOffset = positionInStaff - this._staff.positionInStaff(coord);
    }
    this.coord = coord;
    this.snappedCoord = this.computeSnappedCoord();
    if (this._id.length === 0) { this.refreshIds(); }
  }

  get id() { return this._id; }
  get staffPositionOffset() { return this._staffPositionOffset; }
  set staffPositionOffset(o: number) { this._staffPositionOffset = Math.min(1, Math.max(-1, o)); }

  get coord() { return this._coord; }
  set coord(p: Point) { if (!this._coord.equals(p)) { this._coord.copyFrom(p); } this.snappedCoord = p; }

  refreshIds() {
    if (this.symbol === SymbolType.Note) {
      this._id = IdGenerator.newId(IdType.Note);
    } else if (this.symbol === SymbolType.Clef) {
      this._id = IdGenerator.newId(IdType.Clef);
    } else if (this.symbol === SymbolType.Accid) {
      this._id = IdGenerator.newId(IdType.Accidential);
    }
  }

  get snappedCoord() { return this._snappedCoord; }
  set snappedCoord(c: Point) { if (!c.equals(this._snappedCoord)) { this._snappedCoord.copyFrom(c); } }

  computeSnappedCoord(): Point {
    const staff = this.staff;
    const snappedCoord = this.coord.copy();
    if (staff) {
      snappedCoord.y = staff.snapToStaff(this.coord, this.staffPositionOffset);
    }
    return snappedCoord;
  }

  protected get positionInStaff() {
    return this._staff.positionInStaff(this.coord) + this.staffPositionOffset;
  }

  get staff() { return this._staff; }

  attach(staff: MusicLine) {
    if (this._staff === staff) { return; }
    this.detach();
    if (staff) { this._staff = staff; staff.addSymbol(this); }
  }

  detach() {
    if (this._staff) {
      this._staff.removeSymbol(this);
      this._staff = null;
    }
  }

  abstract clone(staff: MusicLine): Symbol;
  abstract toJson();

  get index() {
    if (!this._staff) { return -1; }
    return this._staff.symbols.indexOf(this);
  }

  get next() {
    const n = this.index + 1;
    if (n >= this._staff.symbols.length) { return null; }
    return this._staff.symbols[n];
  }

  get prev() {
    const n = this.index - 1;
    if (n < 0) { return null; }
    return this._staff.symbols[n];
  }

  getPrevByType(type) {
    for (let n = this.index - 1; n >= 0; n--) {
      if (this._staff.symbols[n] instanceof type) {
        return this._staff.symbols[n];
      }
    }
    return null;
  }

}

export class Accidental extends Symbol {
  constructor(
    staff: MusicLine,
    public type = AccidentalType.Natural,
    public coord = new Point(0, 0),
    public fixedSorting = false,
  ) {
    super(staff, SymbolType.Accid, coord, MusicSymbolPositionInStaff.Undefined, '', fixedSorting);
  }

  static fromJson(json, staff: MusicLine) {
    if (!json) { return null; }
    return new Accidental(
      staff,
      json.type,
      Point.fromString(json.coord),
      json.fixedSorting || false,
    );
  }

  clone(staff: MusicLine = null): Symbol {
    if (staff === null) {
      staff = this._staff;
    }
    return new Accidental(
      staff,
      this.type,
      this.coord.copy(),
    );
  }

  toJson() {
    return {
      symbol: this.symbol,
      type: this.type,
      coord: this.coord.toString(),
    };
  }

}


export class Note extends Symbol {
  constructor(
    staff: MusicLine,
    public type = NoteType.Normal,
    coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    public graphicalConnection = GraphicalConnectionType.Gaped,
    public isNeumeStart = true,
    public syllable: Syllable = null,
    id = '',
    public fixedSorting = false,
  ) {
    super(staff, SymbolType.Note, coord, positionInStaff, id, fixedSorting);
  }

  static fromJson(json, staff: MusicLine) {
    return new Note(
      staff,
      json.type,
      Point.fromString(json.coord),
      json._positionInStaff,
      json.graphicalConnection,
      json.isNeumeStart,
      json.syllable,
      json.id,
      json.fixedSorting || false,
    );
  }

  get isLogicalConnectedToPrev() { return this.graphicalConnection === GraphicalConnectionType.Looped || !this.isNeumeStart; }

  isSyllableConnectionAllowed() {
    // Neume start: either manually, or after clef/accidental (non Note) or start of line
    if (this.isNeumeStart) {
      return true;
    }
    if (!this.staff) {
      return false;
    }
    const idx = this.staff.symbols.findIndex(r => r === this);
    if (idx <= 0) {
      return true;
    }
    return !(this.staff.symbols[idx - 1] instanceof Note);
  }

  clone(staff: MusicLine = null): Symbol {
    if (staff === null) { staff = this._staff; }
    return new Note(
      staff,
      this.type,
      this.coord.copy(),
      MusicSymbolPositionInStaff.Undefined,
      GraphicalConnectionType.Gaped,
      this.isNeumeStart,
      null,
    );
  }


  toJson() {
    return {
      symbol: this.symbol,
      type: this.type,
      coord: this.coord.toString(),
      positionInStaff: this.positionInStaff,
      graphicalConnection: this.graphicalConnection,
      fixedSorting: this.fixedSorting,
    };
  }
}


export class Clef extends Symbol {
  constructor(
    staff: MusicLine,
    public type = ClefType.Clef_F,
    public coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    public fixedSorting = false,
  ) {
    super(staff, SymbolType.Clef, coord, positionInStaff, '', fixedSorting);
  }

  static fromJson(json, staff: MusicLine) {
    return new Clef(
      staff,
      json.type,
      Point.fromString(json.coord),
      json.positionInStaff,
      json.fixedSorting || false,
    );
  }

  clone(staff: MusicLine = null): Symbol {
    if (staff === null) { staff = this._staff; }
    return new Clef(
      staff,
      this.type,
      this.coord.copy(),
      MusicSymbolPositionInStaff.Undefined,
    );
  }

  toJson() {
    return {
      symbol: this.symbol,
      type: this.type,
      coord: this.coord.toString(),
      positionInStaff: this.positionInStaff,
    };
  }
}
