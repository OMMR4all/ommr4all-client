import {
  AccidentalType,
  ClefType,
  GraphicalConnectionType,
  MusicSymbolPositionInStaff,
  NoteType,
  SymbolErrorType,
  SymbolType
} from '../definitions';
import {Point} from 'src/app/geometry/geometry';
import {Syllable} from '../syllable';
import {IdGenerator, IdType} from '../id-generator';
import {PageLine} from '../pageLine';
import {UserCommentHolder} from '../userComment';

type MusicLine = PageLine;

class SymbolPredictionConfidence {

  constructor(public background: number, public noteStart: number, public noteLooped: number, public noteGapped: number, public clefC: number, public clefF: number,
              public accidNatural: number, public accidSharp: number, public accidFlat: number) {

  }

  static fromJson(json) {
    if (!json) {
      return null;
    }
    return new SymbolPredictionConfidence(
      json.background,
      json.noteStart, json.noteLooped, json.noteGapped,
      json.clefC, json.clefF,
      json.accidNatural, json.accidSharp, json.accidFlat
    );
  }

  toJson() {
    return {
      background: this.background,
      noteStart: this.noteStart,
      noteLooped: this.noteLooped,
      noteGapped: this.noteGapped,
      clefC: this.clefC,
      clefF: this.clefF,
      accidNatural: this.accidNatural,
      accidSharp: this.accidSharp,
      accidFlat: this.accidFlat,
    };
  }
}
class SymbolSequenceConfidence {

  constructor(public confidence: number, public tokenLength: number) {

  }

  static fromJson(json) {
    if (!json) {
      return null;
    }
    return new SymbolSequenceConfidence(
      json.confidence,
      json.tokenLength,
    );
  }

  toJson() {
    return {
      confidence: this.confidence,
      tokenLength: this.tokenLength,
    };
  }
}
export class SymbolConfidence {

  constructor(public symbolPredictionConfidence: SymbolPredictionConfidence,
              public symbolSequenceConfidence: SymbolSequenceConfidence,
              public symbolErrorType: SymbolErrorType = SymbolErrorType.SEQUENCE) {
  }

  static fromJson(json) {
    if (!json) {
      return null;
    }
    return new SymbolConfidence(SymbolPredictionConfidence.fromJson(json.symbolPredictionConfidence),
      SymbolSequenceConfidence.fromJson(json.symbolSequenceConfidence),
      json.symbolErrorType,
    );
  }

  toJson() {
    return {
      symbolPredictionConfidence: this.symbolPredictionConfidence ? this.symbolPredictionConfidence.toJson() : null,
      symbolSequenceConfidence: this.symbolSequenceConfidence ? this.symbolSequenceConfidence.toJson() : null,
      symbolErrorType: this.symbolErrorType} ;
  }

}


export abstract class MusicSymbol implements UserCommentHolder {
  protected _staff: MusicLine;
  private _staffPositionOffset = 0;
  readonly _coord = new Point(0, 0);
  readonly _snappedCoord = new Point(0, 0);

  get commentOrigin() {
    return this._coord;
  }

  static fromType(type: SymbolType, subType: ClefType | AccidentalType | NoteType = null) {
    if (type === SymbolType.Note) {
      const n = new Note(null);
      if (subType) {
        n.type = subType as NoteType;
      }
      return n;
    } else if (type === SymbolType.Clef) {
      const c = new Clef(null);
      if (subType) {
        c.type = subType as ClefType;
      }
      return c;
    } else if (type === SymbolType.Accid) {
      const a = new Accidental(null);
      if (subType) {
        a.type = subType as AccidentalType;
      }
      return a;
    } else {
      console.error('Unimplemented symbol type' + type);
    }
  }

  static fromJson(json, staff: MusicLine = null, debugSymbol = false) {
    let symbol: MusicSymbol;
    if (json.type === SymbolType.Note) {
      symbol = Note.fromJson(json, staff, debugSymbol);
    } else if (json.type === SymbolType.Accid) {
      symbol = Accidental.fromJson(json, staff, debugSymbol);
    } else if (json.type === SymbolType.Clef) {
      symbol = Clef.fromJson(json, staff, debugSymbol);
    } else {
      console.error('Unimplemented symbol type: ' + json.type + ' of json ' + json);
      return undefined;
    }
    return symbol;
  }

  constructor(
    staff: MusicLine,
    public readonly symbol: SymbolType,
    coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    private _id = '',
    public fixedSorting = false,
    public symbolConfidence: SymbolConfidence = null,
    public debugSymbol= false,
    public missing = false
  ) {
    this.attach(staff);
    if (positionInStaff !== MusicSymbolPositionInStaff.Undefined && !coord.isZero()) {
      // this.staffPositionOffset = positionInStaff - this._staff.positionInStaff(coord);
      this.staffPositionOffset = 0;
    }
    this.coord = coord;
    this.snappedCoord = this.computeSnappedCoord();
    if (!this._id || this._id.length === 0) {
      this.refreshIds();
    }
  }

  abstract get subType(): NoteType | AccidentalType | ClefType;

  get id() {
    return this._id;
  }
  get staffPosition() {
    return this.positionInStaff;
  }
  get isOnStaffLine() {
    return (this.staffPosition % 2 === 1);
  }
  get staffPositionOffset() {
    return this._staffPositionOffset;
  }

  set staffPositionOffset(o: number) {
    this._staffPositionOffset = Math.min(1, Math.max(-1, o));
  }

  get coord() {
    return this._coord;
  }

  set coord(p: Point) {
    if (!this._coord.equals(p)) {
      this._coord.copyFrom(p);
    }
    this.snappedCoord = p;
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

  get snappedCoord() {
    return this._snappedCoord;
  }

  set snappedCoord(c: Point) {
    if (!c.equals(this._snappedCoord)) {
      this._snappedCoord.copyFrom(c);
    }
  }

  computeSnappedCoord(): Point {
    const staff = this.staff;
    const snappedCoord = this.coord.copy();
    if (staff) {
      snappedCoord.y = staff.snapToStaff(this.coord, this.staffPositionOffset);
    }
    return snappedCoord;
  }

  protected get positionInStaff() {
    let clef = false;
    if (this.symbol === SymbolType.Clef) {
      clef = true;
    }
    return this._staff.positionInStaff(this.coord, clef) + this.staffPositionOffset;
  }

  get staff() {
    return this._staff;
  }

  attach(staff: MusicLine) {
    if (this._staff === staff) {
      return;
    }
    if (this.debugSymbol === false) {
      this.detach();
      if (staff) {
        this._staff = staff;
        staff.addSymbol(this);
      }
    } else {
      if (staff) {
        this._staff = staff;
        staff.addDebugSymbol(this);
      }
    }
  }

  detach() {
    if (this._staff) {
      if (!this.debugSymbol) {
        this._staff.removeSymbol(this);
        this._staff = null;
      } else {
        this._staff.removeDebugSymbol(this);
        this._staff = null;
      }
    }
  }

  abstract clone(staff: MusicLine): MusicSymbol;

  abstract toJson();

  get index() {
    if (!this._staff) {
      return -1;
    }
    return this._staff.symbols.indexOf(this);
  }

  get next() {
    const n = this.index + 1;
    if (n >= this._staff.symbols.length) {
      return null;
    }
    return this._staff.symbols[n];
  }

  get prev() {
    const n = this.index - 1;
    if (n < 0) {
      return null;
    }
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

export class Accidental extends MusicSymbol {
  constructor(
    staff: MusicLine,
    public type = AccidentalType.Natural,
    coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    public fixedSorting = false,
    id = '',
    symbolConfidence: SymbolConfidence = null,
    public debugSymbol= false,
    public missing = false

  ) {
    super(staff, SymbolType.Accid, coord, positionInStaff, id, fixedSorting, symbolConfidence, debugSymbol);
  }

  static fromJson(json, staff: MusicLine, debugSymbol= false) {
    if (!json) {
      return null;
    }
    return new Accidental(
      staff,
      json.accidType,
      Point.fromString(json.coord),
      json.positionInStaff === undefined ? MusicSymbolPositionInStaff.Undefined : json.positionInStaff,
      json.fixedSorting || false,
      json.id,
      SymbolConfidence.fromJson(json.symbolConfidence),
      debugSymbol,
      json.missing,
    );
  }

  get subType() {
    return this.type;
  }
  get getPositionInStaff() {
    return this.positionInStaff;
  }
  clone(staff: MusicLine = null): MusicSymbol {
    if (staff === null) {
      staff = this._staff;
    }
    return new Accidental(
      staff,
      this.type,
      this.coord.copy(),
      MusicSymbolPositionInStaff.Undefined,
    );
  }

  toJson() {
    return {
      id: this.id,
      type: this.symbol,
      accidType: this.type,
      coord: this.coord.toString(),
      positionInStaff: this.positionInStaff,
      symbolConfidence: this.symbolConfidence ? this.symbolConfidence.toJson() : null,
      missing: this.missing

    };
  }

}


export class Note extends MusicSymbol {
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
    symbolConfidence: SymbolConfidence = null,
    public debugSymbol= false,
    public missing = false,

  ) {
    super(staff, SymbolType.Note, coord, positionInStaff, id, fixedSorting, symbolConfidence, debugSymbol, missing);
  }

  static fromJson(json, staff: MusicLine, debugSymbol= false) {
    const note = new Note(
      staff,
      json.noteType,
      Point.fromString(json.coord),
      json._positionInStaff,
      json.graphicalConnection === GraphicalConnectionType.Gaped ? GraphicalConnectionType.Gaped : GraphicalConnectionType.Looped,
      json.graphicalConnection === GraphicalConnectionType.NeumeStart,
      json.syllable,
      json.id,
      json.fixedSorting || false,
      SymbolConfidence.fromJson(json.symbolConfidence),
      debugSymbol,
      json.missing,
    );
    return note;
  }

  get subType() {
    return this.type;
  }
  get getPositionInStaff() {
    return this.positionInStaff;
  }
  get isLogicalConnectedToPrev() {
    return this.graphicalConnection === GraphicalConnectionType.Gaped && !this.isNeumeStart;
  }

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

  clone(staff: MusicLine = null): MusicSymbol {
    if (staff === null) {
      staff = this._staff;
    }
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
      id: this.id,
      type: this.symbol,
      noteType: this.type,
      coord: this.coord.toString(),
      positionInStaff: this.positionInStaff,
      graphicalConnection: this.isNeumeStart ? GraphicalConnectionType.NeumeStart : this.graphicalConnection,
      fixedSorting: this.fixedSorting,
      symbolConfidence: this.symbolConfidence ? this.symbolConfidence.toJson() : null,
      missing: this.missing

    };
  }

  getSyllableConnectionNote(): Note {
    if (this.isSyllableConnectionAllowed()) {
      return this;
    }
    const notes = this.staff.symbols.filter(n => n instanceof Note);
    let idx = notes.indexOf(this);
    while (idx > 0) {
      idx--;
      const n = notes[idx] as Note;
      if (n.isSyllableConnectionAllowed()) {
        return n as Note;
      }
    }
    return null;
  }
}


export class Clef extends MusicSymbol {
  constructor(
    staff: MusicLine,
    public type = ClefType.Clef_F,
    coord = new Point(0, 0),
    positionInStaff = MusicSymbolPositionInStaff.Undefined,
    public fixedSorting = false,
    id = '',
    symbolConfidence: SymbolConfidence = null,
    public debugSymbol= false,
    public missing = false,

  ) {
    super(staff, SymbolType.Clef, coord, positionInStaff, id, fixedSorting, symbolConfidence, debugSymbol);
  }

  static fromJson(json, staff: MusicLine, debugSymbol = false) {
    return new Clef(
      staff,
      json.clefType,
      Point.fromString(json.coord),
      json.positionInStaff,
      json.fixedSorting || false,
      json.id,
      SymbolConfidence.fromJson(json.symbolConfidence),
      debugSymbol,
      json.missing,
    );
  }

  get subType() {
    return this.type;
  }

  get getPositionInStaff(): MusicSymbolPositionInStaff{
    return this.positionInStaff;
  }

  clone(staff: MusicLine = null): MusicSymbol {
    if (staff === null) {
      staff = this._staff;
    }
    return new Clef(
      staff,
      this.type,
      this.coord.copy(),
      MusicSymbolPositionInStaff.Undefined,
    );
  }

  toJson() {
    return {
      id: this.id,
      type: this.symbol,
      clefType: this.type,
      coord: this.coord.toString(),
      positionInStaff: this.positionInStaff,
      symbolConfidence: this.symbolConfidence ? this.symbolConfidence.toJson() : null,
      missing: this.missing

    };
  }
}
