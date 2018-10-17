import {EmptyMusicRegionDefinition, GraphicalConnectionType, MusicSymbolPositionInStaff, SymbolType} from '../definitions';
import {Point, PolyLine} from '../../../geometry/geometry';
import {StaffLine} from './staff-line';
import {Accidental, Clef, Note, Symbol} from './symbol';
import {Region} from '../region';
import {IdType} from '../id-generator';


export class MusicLine extends Region {
  private _symbols: Array<Symbol> = [];
  private _avgStaffLineDistance = 0;

  static create(
    parent: Region,
    coords = new PolyLine([]),
    staffLines: Array<StaffLine> = [],
    symbols: Array<Symbol> = [],
    id = '',
  ) {
    const se = new MusicLine();
    se._id = id;
    se.attachToParent(parent);
    se.coords = coords;
    staffLines.forEach(sl => sl.attachToParent(se));
    se._symbols = symbols;
    se.update();
    return se;
  }

  constructor() {
    super(IdType.MusicLine);
  }

  static fromJson(json, parent: Region) {
    const staff = MusicLine.create(
      parent,
      PolyLine.fromString(json.coords),
      [],
      [],
      json.id,
    );
    // Staff lines are required for clef and note positioning if available, so attach it first
    json.staffLines.map(s => StaffLine.fromJson(s, staff));
    json.clefs.map(s => Clef.fromJson(s, staff));
    json.neumes.map(n => {
      const nc = n.nc;
      for (let i = 0; i < nc.length; i++) {
        if (i === 0) {
          // set id to first note (marks neume start)
          nc[i].id = n.id.replace('neume', 'note');
        }
        const note = Note.fromJson(nc[i], staff);
        note.isNeumeStart = i === 0;
      }
    });
    staff.update();
    return staff;
  }

  toJson() {
    const neumes = [];
    this.getNotes().forEach(note => {
      if (neumes.length === 0 || note.isNeumeStart) {
        const json = note.toJson();
        neumes.push({
          nc: [json],
          id: note.id.replace('note', 'neume'),
        });
      } else {
        neumes[neumes.length - 1].nc.push(note.toJson());
      }
      }
    );
    return {
      id: this.id,
      coords: this.coords.toString(),
      staffLines: this.staffLines.map(s => s.toJson()),
      clefs: this.getClefs().map(c => c.toJson()),
      accids: this.getAccids().map(c => c.toJson()),
      neumes: neumes,
    };
  }

  get avgStaffLineDistance() { return this._avgStaffLineDistance; }

  refreshIds() {
    super.refreshIds();
    this._symbols.forEach(s => s.refreshIds());
  }

  clean() {
    this.staffLines.filter(s => s.coords.points.length === 0).forEach(s => s.detachFromParent());
  }

  isNotEmpty(flags = EmptyMusicRegionDefinition.Default) {
    if ((flags & EmptyMusicRegionDefinition.HasDimension) && this.coords.points.length > 0) { return true; }  // tslint:disable-line
    if ((flags & EmptyMusicRegionDefinition.HasStaffLines) && this.staffLines.length > 0) { return true; }    // tslint:disable-line
    if ((flags & EmptyMusicRegionDefinition.HasSymbols) && this.symbols.length > 0) { return true; }          // tslint:disable-line
    return false;
  }

  isEmpty(flags = EmptyMusicRegionDefinition.Default): boolean {
    return !this.isNotEmpty(flags);
  }

  /*
   * Staff Lines
   * ===================================================================================================
   */

  get staffLines(): Array<StaffLine> { return this._children.filter(region => region instanceof StaffLine) as Array<StaffLine>; }

  staffLineByCoords(coords: PolyLine): StaffLine {
    for (const staffLine of this.staffLines) {
      if (staffLine.coords === coords) { return staffLine; }
    }
    return null;
  }

  addStaffLine(staffLine: StaffLine): void {
    staffLine.attachToParent(this);
  }

  removeStaffLine(staffLine: StaffLine): void {
    staffLine.detachFromParent();
  }

  hasStaffLineByCoords(coords: PolyLine): boolean { return this.staffLineByCoords(coords) !== null; }

  hasStaffLine(staffLine: StaffLine): boolean { return this._children.indexOf(staffLine) >= 0; }

  positionInStaff(p: Point): MusicSymbolPositionInStaff {
    if (this.staffLines.length <= 1) {
      return MusicSymbolPositionInStaff.Undefined;
    }

    const yOnStaff = [];
    for (const staffLine of this.staffLines) {
      yOnStaff.push(staffLine.coords.interpolateY(p.x));
    }
    yOnStaff.sort((n1, n2) => n1 - n2);
    const avgStaffDistance = (yOnStaff[yOnStaff.length - 1] - yOnStaff[0]) / (yOnStaff.length - 1);

    if (p.y <= yOnStaff[0]) {
      const d = yOnStaff[0] - p.y;
      return Math.min(Math.round(2 * d / avgStaffDistance), 3) + this.staffLines.length * 2 + 1;
    } else if (p.y >= yOnStaff[yOnStaff.length - 1]) {
      const d = p.y - yOnStaff[yOnStaff.length - 1];
      return Math.max(MusicSymbolPositionInStaff.Space_0, MusicSymbolPositionInStaff.Line_1 - Math.round(2 * d / avgStaffDistance));
    } else {
      let y1 = yOnStaff[0];
      let y2 = yOnStaff[1];
      let i = 2;
      for (; i < yOnStaff.length; i++) {
        if (p.y >= y2) {
          y1 = y2;
          y2 = yOnStaff[i];
        } else {
          break;
        }
      }
      const d = p.y - y1;
      return 2 - Math.round(2 * d / (y2 - y1)) + MusicSymbolPositionInStaff.Line_1 + (this.staffLines.length - i) * 2;
    }
  }

  snapToStaff(p: Point, offset: number = 0): number {
    if (this.staffLines.length <= 1) {
      return p.y;
    }
    const yOnStaff = [];
    for (const staffLine of this.staffLines) {
      yOnStaff.push(staffLine.coords.interpolateY(p.x));
    }
    yOnStaff.sort((n1, n2) => n1 - n2);
    const avgStaffDistance = (yOnStaff[yOnStaff.length - 1] - yOnStaff[0]) / (yOnStaff.length - 1);

    if (p.y <= yOnStaff[0]) {
      const d = yOnStaff[0] - p.y;
      return yOnStaff[0] - Math.min(offset + Math.round(2 * d / avgStaffDistance), 3) * avgStaffDistance / 2;
    } else if (p.y >= yOnStaff[yOnStaff.length - 1]) {
      const d = p.y - yOnStaff[yOnStaff.length - 1];
      return yOnStaff[yOnStaff.length - 1] + Math.min(-offset + Math.round(2 * d / avgStaffDistance), 3) * avgStaffDistance / 2;
    } else {
      let y1 = yOnStaff[0];
      let y2 = yOnStaff[1];
      for (let i = 2; i < yOnStaff.length; i++) {
        if (p.y >= y2) {
          y1 = y2;
          y2 = yOnStaff[i];
        } else {
          break;
        }
      }
      const d = p.y - y1;
      return y1 + (-offset + Math.round(2 * d / (y2 - y1))) * (y2 - y1) / 2;
    }
  }

  /*
   * Symbols
   * ===================================================================================================
   */
  get symbols(): Array<Symbol> { return this._symbols; }

  filterSymbols(type: SymbolType) { return this._symbols.filter(s => s.symbol === type); }

  getNotes(): Array<Note> { return this.filterSymbols(SymbolType.Note) as Array<Note>; }

  getClefs(): Array<Clef> { return this.filterSymbols(SymbolType.Clef) as Array<Clef>; }

  getAccids(): Array<Accidental> { return this.filterSymbols(SymbolType.Accid) as Array<Accidental>; }

  hasSymbol(symbol: Symbol) { return this._symbols.indexOf(symbol) >= 0; }

  addSymbol(symbol: Symbol) {
    if (!symbol || this.hasSymbol(symbol)) { return; }
    this._symbols.push(symbol);
    symbol.attach(this);
  }

  removeSymbol(symbol: Symbol) {
    if (!symbol || !this.hasSymbol(symbol)) { return; }
    this._symbols.splice(this._symbols.indexOf(symbol), 1);
    symbol.detach();
  }

  sortedSymbols(): Array<Symbol> {
    return this._symbols.sort((a, b) => a.coord.x - b.coord.x);
  }

  closestSymbolToX(x: number, type: SymbolType, leftOnly = false): Symbol {
    let bestD = 1000000;
    let bestS = null;
    if (leftOnly) {
      this._symbols.forEach(symbol => {
        if (type === symbol.symbol && x - symbol.coord.x < bestD && x > symbol.coord.x) {
          bestD = Math.abs(x - symbol.coord.x);
          bestS = symbol;
        }
      });
    } else {
      this._symbols.forEach(symbol => {
        if (type === symbol.symbol && Math.abs(x - symbol.coord.x) < bestD) {
          bestD = Math.abs(x - symbol.coord.x);
          bestS = symbol;
        }
      });
    }
    return bestS;
  }

  /*
   * Internal State
   * ===================================================================================================
   */

  update() {
    this._updateSorting();
    this._updateAvgStaffLineDistance();
    this.symbols.forEach(s => s.updateSnappedCoord());
  }

  private _updateSorting() {
    this.staffLines.forEach((line) => { line.updateSorting(); });
    this._updateStaffLineSorting();
  }

  private _updateStaffLineSorting() {
    // this._staffLines = this.staffLines.sort((a, b) => a.coords.averageY() - b.coords.averageY());
  }

  private _updateAvgStaffLineDistance() {
    const staffLines = this.staffLines;
    if (staffLines.length <= 1) {
      this._avgStaffLineDistance = 5;  // TODO: Default value?
    } else {
      this._avgStaffLineDistance = (staffLines[staffLines.length - 1].coords.averageY()
        - staffLines[0].coords.averageY()) / (staffLines.length - 1);
    }
  }
}
