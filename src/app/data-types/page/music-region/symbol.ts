import {StaffEquiv} from './staff-equiv';
import {AccidentalType, ClefType, GraphicalConnectionType, MusicSymbolPositionInStaff, NoteType, SymbolType} from '../definitions';
import {Point} from 'src/app/geometry/geometry';
import {Page} from '../page';
import {Syllable} from '../syllable';

export abstract class Symbol {
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
    protected _staff: StaffEquiv,
    readonly symbol: SymbolType,
    public coord: Point,
    public positionInStaff = MusicSymbolPositionInStaff.Undefined,
  ) {
  }

  get staff() { return this._staff; }

  attach(staff: StaffEquiv) {
    if (this._staff === staff) { return; }
    this.detach();
    if (staff) { this._staff = staff; staff.addSymbol(this); }
  }

  detach() {
    if (this._staff) {
      this._staff = null;
      this._staff.removeSymbol(this);
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
    public positionInStaff = MusicSymbolPositionInStaff.Undefined,
    public graphicalConnection = GraphicalConnectionType.None,
    public accidental = new Accidental(),
    public syllable = null,
  ) {
    super(staff, SymbolType.Note, coord, positionInStaff);
  }

  static fromJson(json, staff: StaffEquiv) {
    return new Note(
      staff,
      json.type,
      Point.fromString(json.coord),
      json.positionInStaff,
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
      this.positionInStaff,
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
      accidental: this.accidental.toJson(),
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
    public positionInStaff = MusicSymbolPositionInStaff.Undefined,
  ) {
    super(staff, SymbolType.Clef, coord);
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
      this.positionInStaff
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
