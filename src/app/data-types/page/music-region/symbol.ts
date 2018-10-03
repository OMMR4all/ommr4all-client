import {StaffEquiv} from './staff-equiv';
import {AccidentalType, ClefType, GraphicalConnectionType, MusicSymbolPositionInStaff, NoteType, SymbolType} from '../definitions';
import {Point} from 'src/app/geometry/geometry';
import {Page} from '../page';
import {Syllable} from '../syllable';

export abstract class Symbol {
  protected _staff: StaffEquiv;
  private _staffPositionOffset = 0;
  readonly _coord = new Point(0, 0);
  readonly _snappedCoord = new Point(0, 0);

  static fromType(type: SymbolType) {
    if (type === SymbolType.Note) {
      return new Note(null);
    } else if (type === SymbolType.Clef) {
      return new Clef(null);
    } else {
      console.error('Unimplemented symbol type' + type);
    }

  }

  constructor(
    staff: StaffEquiv,
    readonly symbol: SymbolType,
    coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
  ) {
    this.attach(staff);
    if (positionInStaff !== MusicSymbolPositionInStaff.Undefined && !coord.isZero()) {
      this.staffPositionOffset = positionInStaff - this._staff.positionInStaff(coord);
    }
    this.coord = coord;
  }

  get staffPositionOffset() { return this._staffPositionOffset; }
  set staffPositionOffset(o: number) { this._staffPositionOffset = Math.min(1, Math.max(-1, o)); this.updateSnappedCoord(); }

  get coord() { return this._coord; }
  set coord(p: Point) { this._coord.copyFrom(p); this.updateSnappedCoord(); }

  updateSnappedCoord(staff: StaffEquiv = null) {
    this._snappedCoord.copyFrom(this.coord);
    if (staff) {
      this._snappedCoord.y = staff.snapToStaff(this._coord, this.staffPositionOffset);
    } else if (this._staff) {
      this._snappedCoord.y = this._staff.snapToStaff(this._coord, this.staffPositionOffset);
    }
  }

  get snappedCoord() { return this._snappedCoord; }

  protected get positionInStaff() {
    return this._staff.positionInStaff(this.coord) + this.staffPositionOffset;
  }

  get staff() { return this._staff; }

  attach(staff: StaffEquiv) {
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

  abstract clone(staff: StaffEquiv): Symbol;
  abstract toJson();
  abstract _resolveCrossRefs(page: Page): void;

}

export class Accidental {
  constructor(
    public type = AccidentalType.Natural,
    public coord = new Point(0, 0),
  ) {}

  static fromJson(json) {
    if (!json) { return null; }
    return new Accidental(
      json.type,
      Point.fromString(json.coord),
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
    staff: StaffEquiv,
    public type = NoteType.Normal,
    public coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    public graphicalConnection = GraphicalConnectionType.None,
    public accidental: Accidental = null,
    public syllable: Syllable = null,
  ) {
    super(staff, SymbolType.Note, coord, positionInStaff);
  }

  static fromJson(json, staff: StaffEquiv) {
    return new Note(
      staff,
      json.type,
      Point.fromString(json.coord),
      json._positionInStaff,
      json.graphicalConnection,
      Accidental.fromJson(json.accidental),
      json.syllable,
    );
  }

  clone(staff: StaffEquiv = null): Symbol {
    if (staff === null) { staff = this._staff; }
    return new Note(
      staff,
      this.type,
      this.coord.copy(),
      MusicSymbolPositionInStaff.Undefined,
      GraphicalConnectionType.None,
      null,
      null,
    );
  }


  toJson() {
    return {
      type: this.type,
      coord: this.coord.toString(),
      positionInStaff: this.positionInStaff,
      graphicalConnection: this.graphicalConnection,
      accidental: this.accidental ? this.accidental.toJson() : null,
      syllable: this.syllable ? this.syllable.id : null,
    };
  }

  _resolveCrossRefs(page: Page) {
    if (this.syllable && !(this.syllable instanceof Syllable)) {
      const s_id = this.syllable as string;
      this.syllable = page.syllableById(s_id);
      if (!this.syllable) {
        console.error('Syllable with id ' + s_id + ' not found.');
      }
    }
  }

}


export class Clef extends Symbol {
  constructor(
    staff: StaffEquiv,
    public type = ClefType.Clef_F,
    public coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
  ) {
    super(staff, SymbolType.Clef, coord, positionInStaff);
  }

  static fromJson(json, staff: StaffEquiv) {
    return new Clef(
      staff,
      json.type,
      Point.fromString(json.coord),
      json.positionInStaff,
    );
  }

  clone(staff: StaffEquiv = null): Symbol {
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

  _resolveCrossRefs(page: Page) {
  }
}
