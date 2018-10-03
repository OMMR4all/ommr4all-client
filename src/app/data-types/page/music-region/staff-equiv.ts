import {EquivIndex, MusicSymbolPositionInStaff, SymbolType} from '../definitions';
import {Point, PolyLine, Rect} from '../../../geometry/geometry';
import {StaffLine} from './staff-line';
import {Clef, Note, Symbol} from './symbol';
import {min} from 'rxjs/operators';


export class StaffEquiv {
  private _symbols: Array<Symbol> = [];
  readonly _AABB = new Rect();
  private _avgStaffLineDistance = 0;
  private _staffLines: Array<StaffLine>;

  constructor(
    public coords = new PolyLine([]),
    staffLines: Array<StaffLine> = [],
    symbols: Array<Symbol> = [],
    public index = EquivIndex.GroudTruth,
  ) {
    this._staffLines = staffLines;
    this._symbols = symbols;
  }

  static fromJson(json) {
    const staff = new StaffEquiv(
      PolyLine.fromString(json.coords),
      [],
      [],
      json.index,
    );
    // Staff lines are required for clef and note positioning if available, so attach it first
    json.staffLines.map(s => StaffLine.fromJson(s, staff));
    json.clefs.map(s => Clef.fromJson(s, staff));
    json.notes.map(n => Note.fromJson(n, staff));
    staff.update();
    return staff;
  }

  toJson() {
    return {
      coords: this.coords.toString(),
      staffLines: this.staffLines.map(s => s.toJson()),
      clefs: this.getClefs().map(c => c.toJson()),
      notes: this.getNotes().map(n => n.toJson()),
      index: this.index,
    };
  }

  get AABB() { return this._AABB; }
  get avgStaffLineDistance() { return this._avgStaffLineDistance; }

  _resolveCrossRefs(page) {
    this.symbols.forEach(n => n._resolveCrossRefs(page));
  }

  clean() {
    this._staffLines = this._staffLines.filter(s => s.coords.points.length > 0);
  }

  isEmpty(): boolean {
    return this.coords.points.length === 0 && this.staffLines.length === 0 && this.symbols.length === 0;
  }

  /*
   * Staff Lines
   * ===================================================================================================
   */

  get staffLines() { return this._staffLines; }

  staffLineByCoords(coords: PolyLine): StaffLine {
    for (const staffLine of this._staffLines) {
      if (staffLine.coords === coords) { return staffLine; }
    }
    return null;
  }

  addStaffLine(staffLine: StaffLine): void {
    if (!staffLine) { return; }
    if (this.staffLines.indexOf(staffLine) < 0) {
      this.staffLines.push(staffLine);
      this._updateStaffLineSorting();
      staffLine.attach(this);
      this.update();
    }
  }

  removeStaffLine(staffLine: StaffLine): void {
    if (!staffLine) { return; }
    const idx = this.staffLines.indexOf(staffLine);
    if (idx >= 0) {
      this.staffLines.splice(idx, 1);
      staffLine.detach();
      this.update();
    }
  }

  hasStaffLineByCoords(coords: PolyLine): boolean { return this.staffLineByCoords(coords) !== null; }

  hasStaffLine(staffLine: StaffLine): boolean { return this._staffLines.indexOf(staffLine) >= 0; }

  distanceSqrToPoint(p: Point): number {
    return this.AABB.distanceSqrToPoint(p);
  }

  positionInStaff(p: Point): MusicSymbolPositionInStaff {
    if (this._staffLines.length <= 1) {
      return MusicSymbolPositionInStaff.Undefined;
    }

    const yOnStaff = [];
    for (const staffLine of this._staffLines) {
      yOnStaff.push(staffLine.coords.interpolateY(p.x));
    }
    yOnStaff.sort((n1, n2) => n1 - n2);
    const avgStaffDistance = (yOnStaff[yOnStaff.length - 1] - yOnStaff[0]) / (yOnStaff.length - 1);

    if (p.y <= yOnStaff[0]) {
      const d = yOnStaff[0] - p.y;
      return Math.min(Math.round(2 * d / avgStaffDistance), 3) + this._staffLines.length * 2 + 1;
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
      return 2 - Math.round(2 * d / (y2 - y1)) + MusicSymbolPositionInStaff.Line_1 + (this._staffLines.length - i) * 2;
    }
  }

  snapToStaff(p: Point, offset: number = 0): number {
    if (this._staffLines.length <= 1) {
      return p.y;
    }
    const yOnStaff = [];
    for (const staffLine of this._staffLines) {
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
    this._updateAABB();
    this._updateAvgStaffLineDistance();
    this.symbols.forEach(s => s.updateSnappedCoord());
  }

  private _updateSorting() {
    this._staffLines.forEach((line) => { line.updateSorting(); });
    this._updateStaffLineSorting();
  }

  private _updateAABB() {
    this._AABB.zero();
    if (this.coords.points.length > 0) {
      this._AABB.copyFrom(this.coords.aabb());
    }

    this._staffLines.forEach(line => {
      line.updateAABB();
      this._AABB.copyFrom(this._AABB.union(line.AABB));
    });

  }

  private _updateStaffLineSorting() {
    this._staffLines = this.staffLines.sort((a, b) => a.coords.averageY() - b.coords.averageY());
  }

  private _updateAvgStaffLineDistance() {
    if (this._staffLines.length <= 1) {
      this._avgStaffLineDistance = 5;  // TODO: Default value?
    } else {
      this._avgStaffLineDistance = (this._staffLines[this._staffLines.length - 1].coords.averageY()
        - this._staffLines[0].coords.averageY()) / (this._staffLines.length - 1);
    }
  }
}
