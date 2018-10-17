import {MusicLine} from './music-line';
import {AccidentalType, ClefType, GraphicalConnectionType, MusicSymbolPositionInStaff, NoteType, SymbolType} from '../definitions';
import {Point} from 'src/app/geometry/geometry';
import {Page} from '../page';
import {Syllable} from '../syllable';
import {IdGenerator, IdType} from '../id-generator';

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

  constructor(
    staff: MusicLine,
    public readonly symbol: SymbolType,
    coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    private _id = '',
  ) {
    this.attach(staff);
    if (positionInStaff !== MusicSymbolPositionInStaff.Undefined && !coord.isZero()) {
      this.staffPositionOffset = positionInStaff - this._staff.positionInStaff(coord);
    }
    this.coord = coord;
    if (this._id.length === 0) { this.refreshIds(); }
  }

  get id() { return this._id; }
  get staffPositionOffset() { return this._staffPositionOffset; }
  set staffPositionOffset(o: number) { this._staffPositionOffset = Math.min(1, Math.max(-1, o)); this.updateSnappedCoord(); }

  get coord() { return this._coord; }
  set coord(p: Point) { this._coord.copyFrom(p); this.updateSnappedCoord(); }

  updateSnappedCoord(staff: MusicLine = null) {
    this._snappedCoord.copyFrom(this.coord);
    if (staff) {
      this._snappedCoord.y = staff.snapToStaff(this._coord, this.staffPositionOffset);
    } else if (this._staff) {
      this._snappedCoord.y = this._staff.snapToStaff(this._coord, this.staffPositionOffset);
    }
  }

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
  ) {
    super(staff, SymbolType.Accid, coord, MusicSymbolPositionInStaff.Undefined);
  }

  static fromJson(json, staff: MusicLine) {
    if (!json) { return null; }
    return new Accidental(
      staff,
      json.type,
      Point.fromString(json.coord),
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
      type: this.type,
      coord: this.coord.toString(),
    };
  }

}


export class Note extends Symbol {
  constructor(
    staff: MusicLine,
    public type = NoteType.Normal,
    public coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    public graphicalConnection = GraphicalConnectionType.Gaped,
    public isNeumeStart = true,
    public syllable: Syllable = null,
  ) {
    super(staff, SymbolType.Note, coord, positionInStaff);
  }

  static fromJson(json, staff: MusicLine) {
    return new Note(
      staff,
      json.type,
      Point.fromString(json.coord),
      json._positionInStaff,
      json.graphicalConnection,
      json.syllable,
    );
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
      type: this.type,
      coord: this.coord.toString(),
      positionInStaff: this.positionInStaff,
      graphicalConnection: this.graphicalConnection,
    };
  }
}


export class Clef extends Symbol {
  constructor(
    staff: MusicLine,
    public type = ClefType.Clef_F,
    public coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
  ) {
    super(staff, SymbolType.Clef, coord, positionInStaff);
  }

  static fromJson(json, staff: MusicLine) {
    return new Clef(
      staff,
      json.type,
      Point.fromString(json.coord),
      json.positionInStaff,
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
      type: this.type,
      coord: this.coord.toString(),
      positionInStaff: this.positionInStaff,
    };
  }
}
