import {Region} from './region';
import {TextEquiv} from './text-equiv';
import {Word} from './word';
import {Point, PolyLine, Size} from '../../geometry/geometry';
import {IdType} from './id-generator';
import {Block} from './block';
import {
  BlockType, EmptyMusicRegionDefinition,
  EmptyTextRegionDefinition,
  GraphicalConnectionType,
  MusicSymbolPositionInStaff,
  SymbolType,
  TextEquivIndex
} from './definitions';
import {Syllable} from './syllable';
import {Accidental, Clef, Note} from './music-region/symbol';
import {StaffLine} from './music-region/staff-line';
import {Symbol} from './music-region/symbol';

export class LogicalConnection {
  constructor(
    public coord: Point,
    public height: number,
    public dataNote: Note,
  ) {}

  equals(lc: LogicalConnection): boolean {
    return lc.coord.equals(this.coord) && lc.height === this.height && this.dataNote === this.dataNote;
  }
}

export class Line extends Region {
  // TextLine
  public textEquivs = new Array<TextEquiv>();
  public words = new Array<Word>();

  // MusicLine
  private _symbols: Array<Symbol> = [];
  private _staffLines: Array<StaffLine> = [];  // store staff lines a second time for ordering!
  private _avgStaffLineDistance = 0;
  private _logicalConnections: Array<LogicalConnection> = [];

  // =============================================================================
  // General
  // =============================================================================

  static createTextLine(
    block: Block,
    coords = new PolyLine([]),
    textEquivs: Array<TextEquiv> = [],
    words: Array<Word> = [],
    id = '',
  ) {
    const tl = new Line();
    tl.coords = coords;
    tl.textEquivs = textEquivs;
    tl.words = words;
    tl.attachToParent(block);
    tl._id = id;
    return tl;
  }

  static createMusicLine(
    parent: Block,
    coords = new PolyLine([]),
    staffLines: Array<StaffLine> = [],
    symbols: Array<Symbol> = [],
    id = '',
  ) {
    const se = new Line();
    se._id = id;
    se.attachToParent(parent);
    se.coords = coords;
    staffLines.forEach(sl => sl.attachToParent(se));
    se._symbols = symbols;
    se.update();
    return se;
  }


  static fromJson(json, block: Block) {
    if (block.type === BlockType.Music) {
      const line = Line.createMusicLine(
        block,
        PolyLine.fromString(json.coords),
        [],
        [],
        json.id,
      );
      // Staff lines are required for clef and note positioning if available, so attach it first
      json.staffLines.map(s => StaffLine.fromJson(s, line));
      Symbol.symbolsFromJson(json.symbols, line);
      line.update();
      line.avgStaffLineDistance = line.computeAvgStaffLineDistance();
      return line;
    } else {
      return Line.createTextLine(
        block,
        PolyLine.fromString(json.coords),
        json.textEquivs.map(t => TextEquiv.fromJson(t)),
        (json.words) ? json.words.map(w => Word.fromJson(w)) : [],
        json.id,
      );
    }
  }

  private constructor(
  ) {
    super(IdType.Line);
    this.childDetached.subscribe(region => {
      if (region instanceof StaffLine) { this._staffLines.splice(this._staffLines.indexOf(region as StaffLine), 1); }
    });
    this.childAttached.subscribe(region => {
      if (region instanceof StaffLine) { this._staffLines.push(region as StaffLine); this._staffLines.sort((a, b) => a.coords.averageY() - b.coords.averageY()); }
    });
  }

  toJson() {
    if (this.getType() === BlockType.Music) {
      return this.toMusicLineJson();
    } else {
      return this.toTextLineJson();
    }
  }

  getRegion() { return this; }
  getBlock() { return this.parent as Block; }
  getType() { return this.getBlock().type; }

  refreshIds() {
    super.refreshIds();
    this.refreshMusicIds();
    this.refreshTextIds();
  }

  _prepareRender() {
    super._prepareRender();
    this._updateLogicalConnections();
  }

  // ==========================================================================
  // MusicLine
  // ==========================================================================

  toMusicLineJson() {
    const symbols = [];
    this._symbols.forEach(symbol => {
      if (symbol instanceof Note) {
        const note = symbol as Note;
        if (symbols.length === 0 || (note.isNeumeStart && note.graphicalConnection === GraphicalConnectionType.Gaped)
          || symbols[symbols.length - 1].symbol !== SymbolType.Note) {
          const json = note.toJson();
          symbols.push({
            symbol: SymbolType.Note,
            nc: [json],
            id: note.id.replace('note', 'neume'),
          });
        } else {
          symbols[symbols.length - 1].nc.push(note.toJson());
        }
      } else {
        symbols.push(symbol.toJson());
      }

    });
    return {
      id: this.id,
      coords: this.coords.toString(),
      staffLines: this._staffLines.map(s => s.toJson()),
      symbols: symbols,
    };
  }

  get avgStaffLineDistance() { return this._avgStaffLineDistance; }
  set avgStaffLineDistance(d: number) { this._avgStaffLineDistance = d; }
  staffHeight() { if (this.staffLines.length <= 1) { return 0; } else { return this.staffLines[this.staffLines.length - 1].coords.averageY() - this.staffLines[0].coords.averageY(); }}
  get logicalConnections() { return this._logicalConnections; }

  refreshMusicIds() {
    this._symbols.forEach(s => s.refreshIds());
  }

  isMusicLineNotEmpty(flags = EmptyMusicRegionDefinition.Default) {
    if ((flags & EmptyMusicRegionDefinition.HasDimension) && this.coords.points.length > 0) { return true; }  // tslint:disable-line
    if ((flags & EmptyMusicRegionDefinition.HasStaffLines) && this.staffLines.length > 0) { return true; }    // tslint:disable-line
    if ((flags & EmptyMusicRegionDefinition.HasSymbols) && this.symbols.length > 0) { return true; }          // tslint:disable-line
    return false;
  }

  isMusicLineEmpty(flags = EmptyMusicRegionDefinition.Default): boolean {
    return !this.isMusicLineNotEmpty(flags);
  }

  /*
   * Staff Lines
   * ===================================================================================================
   */

  get staffLines(): Array<StaffLine> { return this._staffLines; }

  staffLineByCoords(coords: PolyLine): StaffLine {
    for (const staffLine of this.staffLines) {
      if (staffLine.coords === coords) { return staffLine; }
    }
    return null;
  }

  hasStaffLineByCoords(coords: PolyLine): boolean { return this.staffLineByCoords(coords) !== null; }

  hasStaffLine(staffLine: StaffLine): boolean { return this._children.indexOf(staffLine) >= 0; }

  computeAvgStaffLineDistance(defaultValue = 5) {
    const staffLines = this.staffLines;
    if (staffLines.length <= 1) {
      return defaultValue;
    } else {
      return (staffLines[staffLines.length - 1].coords.averageY()
        - staffLines[0].coords.averageY()) / (staffLines.length - 1);
    }
  }

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

  interpolateToBottom(x: number) {
    if (this.staffLines.length === 0) { return this.AABB.bottom; }
    return this.staffLines[this.staffLines.length - 1].coords.interpolateY(x);
  }

  /*
   * Symbols
   * ===================================================================================================
   */
  get symbols(): Array<Symbol> { return this._symbols; }

  symbolPositionsPolyline(): PolyLine { return new PolyLine(this._symbols.map(s => s.coord)); }

  filterSymbols(type: SymbolType) { return this._symbols.filter(s => s.symbol === type); }

  getNotes(): Array<Note> { return this.filterSymbols(SymbolType.Note) as Array<Note>; }

  getClefs(): Array<Clef> { return this.filterSymbols(SymbolType.Clef) as Array<Clef>; }

  getAccids(): Array<Accidental> { return this.filterSymbols(SymbolType.Accid) as Array<Accidental>; }

  hasSymbol(symbol: Symbol) { return this._symbols.indexOf(symbol) >= 0; }

  addSymbol(symbol: Symbol, idx: number = -1) {
    if (!symbol || this.hasSymbol(symbol)) { return; }
    if (idx < 0) {
      this._symbols.push(symbol);
    } else {
      this._symbols.splice(idx, 0, symbol);
    }
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

  sortSymbol(symbol: Symbol): void {
    if (this._symbols.length <= 1) { return; }
    const idx = this._symbols.indexOf(symbol);
    if (idx < 0) { return; }
    this._symbols.splice(idx, 1);
    if (symbol.coord.x < this._symbols[0].coord.x) {
      this._symbols.splice(0, 0, symbol);
      return;
    }
    for (let i = 0; i < this._symbols.length; ++i) {
      if (this._symbols[i].coord.x > symbol.coord.x) {
        this._symbols.splice(i, 0, symbol);
        return;
      }
    }
    this._symbols.push(symbol);
  }

  closestSymbolToX(x: number, type: SymbolType, leftOnly = false, rightOnly = false): Symbol {
    let bestD = 1000000;
    let bestS = null;
    if (leftOnly) {
      this._symbols.forEach(symbol => {
        if (type === symbol.symbol && x - symbol.coord.x < bestD && x > symbol.coord.x) {
          bestD = Math.abs(x - symbol.coord.x);
          bestS = symbol;
        }
      });
    } else if (rightOnly) {
      this._symbols.forEach(symbol => {
        if (type === symbol.symbol && symbol.coord.x - x < bestD && x < symbol.coord.x) {
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
   * Logical connection markers
   * ===================================================================================================
   */
  _updateLogicalConnections() {
    const out = [];

    const staffLineDistance = this._avgStaffLineDistance;
    const staffHeight = this.staffHeight();
    const additionalSize = 0.5;
    const tailOffset = staffLineDistance * 0.5;
    const bottomOffset = additionalSize / 2 * staffHeight;
    const height = Math.round((1 + additionalSize) * staffHeight);

    const getBottomCoord = (c: Point) => {
      return new Point(Math.round(c.x), Math.round(this.interpolateToBottom(c.x) + bottomOffset));
    };

    for (let i = 0; i < this.symbols.length; i++) {
      if (!(this.symbols[i] instanceof Note)) { continue; }
      const cur = this.symbols[i] as Note;

      const prev = (i > 0) ? this.symbols[i - 1] : null;
      const logicalConnectionStart = !cur.isLogicalConnectedToPrev || (prev && !(prev instanceof Note)) || !prev;
      const next = (i < this.symbols.length - 1) ? this.symbols[i + 1] : null;
      const logicalConnectionEnd = !next || (next && !(next instanceof Note));


      if (logicalConnectionStart) {
        if (prev) {
          if (!prev || (prev && !(prev instanceof Note))) {
            out.push(new LogicalConnection(getBottomCoord(prev.coord.add(cur.coord).scale(0.5)), height, null));
          } else if (!cur.isLogicalConnectedToPrev) {
            // only the intermediate lines can be moved or deleted!
            out.push(new LogicalConnection(getBottomCoord(prev.coord.add(cur.coord).scale(0.5)), height, cur));
          }
        } else {
          out.push(new LogicalConnection(getBottomCoord(cur.coord.translate(new Size(-tailOffset, 0))), height, null));
        }
      }
      if (logicalConnectionEnd) {
        if (next) {
          out.push(new LogicalConnection(getBottomCoord(cur.coord.add(next.coord).scale(0.5)), height, null));
        } else {
          out.push(new LogicalConnection(getBottomCoord(cur.coord.translate(new Size(tailOffset, 0))), height, null));
        }
      }
    }

    const equals = (a: Array<LogicalConnection>, b: Array<LogicalConnection>) => {
      if (a.length !== b.length) { return false; }
      for (let i = 0; i < a.length; i++) {
        if (!a[i].equals(b[i])) { return false; }
      }
      return true;
    };

    if (!equals(this._logicalConnections, out)) {
      this._logicalConnections = out;
    }
  }


  // ==========================================================================
  // TextLine
  // ==========================================================================

  toTextLineJson() {
    return {
      id: this.id,
      coords: this.coords.toString(),
      textEquivs: this.textEquivs.map(t => t.toJson()),
      words: this.words.map(w => w.toJson()),
    };
  }

  syllableById(id: string): Syllable {
    for (const w of this.words) {
      const syl = w.syllabels.find(s => s.id === id);
      if (syl) { return syl; }
    }
    return null;
  }

  cleanSyllables(): void {
    this.words = [];
  }

  getOrCreateTextEquiv(index: TextEquivIndex) {
    for (const te of this.textEquivs) {
      if (te.index === index) { return te; }
    }
    const t = new TextEquiv('', index);
    this.textEquivs.push(t);
    return t;
  }

  clean() {
    this.textEquivs = this.textEquivs.filter(te => te.content.length > 0);
  }

  isTextLineNotEmpty(flags = EmptyTextRegionDefinition.Default) {
    if ((flags & EmptyTextRegionDefinition.HasDimension) && (this.coords.points.length > 0 || this.AABB.area > 0)) { return true; }  // tslint:disable-line no-bitwise max-line-length
    if ((flags & EmptyTextRegionDefinition.HasText) && this.textEquivs.length > 0) { return true; }     // tslint:disable-line no-bitwise max-line-length
    return false;
  }

  isTextLineEmpty(flags = EmptyTextRegionDefinition.Default) {
    return !this.isTextLineNotEmpty(flags);
  }

  refreshTextIds() {
    this.words.forEach(w => w.refreshIds());
    this.textEquivs.forEach(te => te.refreshId());
  }
}
