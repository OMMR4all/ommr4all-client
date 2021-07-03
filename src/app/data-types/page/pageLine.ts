import {Region} from './region';
import {Sentence} from './sentence';
import {Point, PolyLine, Size} from '../../geometry/geometry';
import {IdType} from './id-generator';
import {Block} from './block';
import {BlockType, EmptyRegionDefinition, GraphicalConnectionType, MusicSymbolPositionInStaff, SymbolType,} from './definitions';
import {Syllable} from './syllable';
import {Accidental, Clef, Note, MusicSymbol} from './music-region/symbol';
import {StaffLine} from './music-region/staff-line';

export class LogicalConnection {
  constructor(
    public coord: Point,
    public height: number,
    public dataNote: Note,
    public neumeStart: Note,
  ) {}

  equals(lc: LogicalConnection): boolean {
    return lc.coord.equals(this.coord) && lc.height === this.height && this.dataNote === this.dataNote;
  }
}

export class PageLine extends Region {
  // General
  public reconstructed = false;
  // TextLine
  public sentence = new Sentence();

  // MusicLine
  private _symbols: Array<MusicSymbol> = [];
  private _avgStaffLineDistance = 0;
  private _logicalConnections: Array<LogicalConnection> = [];
  private _additionalSymbols: Array<MusicSymbol> = [];



  // =============================================================================
  // General
  // =============================================================================
  static fromJson(json, block: Block) {
    const line = new PageLine();
    line._id = json.id;
    line.attachToParent(block);
    line.coords = PolyLine.fromString(json.coords);
    line.sentence = Sentence.fromJson(json.sentence);
    line.reconstructed = json.reconstructed === true;

    // Staff lines are required for clef and note positioning if available, so attach it first
    if (json.staffLines) { json.staffLines.map(s => StaffLine.fromJson(s, line)); }
    if (json.symbols) { json.symbols.forEach(s => MusicSymbol.fromJson(s, line)); }
    if (json.additionalSymbols) { json.additionalSymbols.forEach(s => MusicSymbol.fromJson(s, line, true)); }

    line.update();
    line.avgStaffLineDistance = line.computeAvgStaffLineDistance();
    return line;
  }

  public constructor(
    parent: Block = null,
  ) {
    super(IdType.Line);
    if (parent) {
      parent.attachChild(this);
    }
  }

  toJson() {
    return {
      id: this.id,
      coords: this.coords.toString(),
      reconstructed: this.reconstructed,
      sentence: this.sentence.toJson(),
      staffLines: this.staffLines.map(s => s.toJson()),
      symbols: this._symbols.map(s => s.toJson()),
      additionalSymbols: this._additionalSymbols.map(s => s.toJson()),

    };
  }

  getBlock() { return this.parent as Block; }
  get block() { return this.parent as Block; }
  get blockType() { return this.block.type; }
  getType() { return this.getBlock().type; }

  refreshIds() {
    super.refreshIds();
    this.refreshMusicIds();
    this.refreshTextIds();
  }

  protected _pushChild(child: Region) {
    if (child instanceof StaffLine) {
      const dummy = this.staffLines;
      dummy.push(child);
      dummy.sort((a, b) => a.coords.averageY() - b.coords.averageY());
      let idx = dummy.indexOf(child);
      if (idx > 0) {
        // get index after the preceding staff line (if other children exist)
        idx = this._children.indexOf(dummy[idx - 1]) + 1;
      }
      this._children.splice(idx, 0, child);
    } else {
      super._pushChild(child);
    }
  }

  _prepareRender() {
    super._prepareRender();
  }

  update() {
    if (this.updateRequired) {
      this._sortStaffLines();
      this._updateLogicalConnections();
    }
    super.update();
  }

  clean() {
    this.staffLines.filter(l => l.coords.length <= 1).forEach(l => l.detachFromParent());
  }

  isNotEmpty(flags = EmptyRegionDefinition.Default) {
    if ((flags & EmptyRegionDefinition.HasDimension) && (this.coords.points.length > 2 || this.AABB.area > 0)) { return true; }  // tslint:disable-line no-bitwise max-line-length
    if ((flags & EmptyRegionDefinition.HasText) && this.sentence.syllables.length > 0) { return true; }     // tslint:disable-line no-bitwise max-line-length
    if ((flags & EmptyRegionDefinition.HasStaffLines) && this.staffLines.length > 0) { return true; }    // tslint:disable-line
    if ((flags & EmptyRegionDefinition.HasSymbols) && this.symbols.length > 0) { return true; }          // tslint:disable-line
    return false;
  }

  isEmpty(flags = EmptyRegionDefinition.Default) {
    return !this.isNotEmpty(flags);
  }

  // ==========================================================================
  // MusicLine
  // ==========================================================================

  get avgStaffLineDistance() { return this._avgStaffLineDistance; }
  set avgStaffLineDistance(d: number) { this._avgStaffLineDistance = d; }
  staffHeight() { if (this.staffLines.length <= 1) { return 0; } else { return this.staffLines[this.staffLines.length - 1].coords.averageY() - this.staffLines[0].coords.averageY(); }}
  get logicalConnections() { return this._logicalConnections; }

  refreshMusicIds() {
    this._symbols.forEach(s => s.refreshIds());
  }


  /*
   * Staff Lines
   * ===================================================================================================
   */

  _sortStaffLines() {
    const sorted = this.staffLines.sort((a, b) => a.coords.averageY() - b.coords.averageY());
    sorted.forEach(sl => {
      this._children.splice(this._children.indexOf(sl), 1);
      this._children.push(sl);
    });
  }

  get staffLines(): Array<StaffLine> { return this._children.filter(c => c instanceof StaffLine) as Array<StaffLine>; }
  sortedStaffLines(): Array<StaffLine> { return this.staffLines; }

  staffLineByCoords(coords: PolyLine): StaffLine {
    for (const staffLine of this.staffLines) {
      if (staffLine.coords === coords) { return staffLine; }
    }
    return null;
  }

  hasStaffLineByCoords(coords: PolyLine): boolean { return this.staffLineByCoords(coords) !== null; }

  hasStaffLine(staffLine: StaffLine): boolean { return this._children.indexOf(staffLine) >= 0; }

  computeAvgStaffLineDistance(defaultValue = 5) {
    const staffLines = this.sortedStaffLines();
    if (staffLines.length <= 1) {
      return defaultValue;
    } else {
      return (staffLines[staffLines.length - 1].coords.averageY()
        - staffLines[0].coords.averageY()) / (staffLines.length - 1);
    }
  }

  private _roundToStaffPos(x: number) {
    const rounded = Math.round(x);
    const even = (rounded + 2000) % 2 === 0;
    if (!even) {
      if (Math.abs(x - rounded) < 0.4) {
        return rounded;
      } else {
        return x - rounded > 0 ? rounded + 1 : rounded - 1;
      }
    } else {
      return rounded;
    }
  }

  private _interpStaffPos(y: number, top: number, bot: number, top_space: boolean, bot_space: boolean,
                          top_pos: MusicSymbolPositionInStaff, bot_pos: MusicSymbolPositionInStaff,
                          offset: number,
  ): {y: number, pos: MusicSymbolPositionInStaff} {
    const ld = bot - top;
    if (top_space && !bot_space) {
      top -= ld;
      top_pos += 1;
    } else if (!top_space && bot_space) {
      bot += ld;
      bot_pos -= 1;
    } else if (top_space && bot_space) {
      const center = (top + bot) / 2;
      if (center > y) {
        top -= ld / 2;
        bot = center;
        top_pos += 1;
        bot_pos = top_pos - 2;
      } else {
        top = center;
        bot += ld / 2;
        bot_pos -= 1;
        top_pos = bot_pos + 2;
      }
    }

    const d = y - top;
    const rel = d / (bot - top);

    const snapped = -offset + this._roundToStaffPos(2 * rel);

    return {
      y: top + snapped * (bot - top) / 2,
      pos: Math.max(MusicSymbolPositionInStaff.Min, Math.min(MusicSymbolPositionInStaff.Max, top_pos - snapped)),
    };
  }

  private _staffPos(p: Point, offset: number = 0): {y: number, pos: MusicSymbolPositionInStaff} {
    if (this.sortedStaffLines().length <= 1) {
      return {y: p.y, pos: MusicSymbolPositionInStaff.Undefined};
    }
    const yOnStaff = new Array<{line: StaffLine, y: number, pos: MusicSymbolPositionInStaff}>();
    for (const staffLine of this.sortedStaffLines()) {
      yOnStaff.push({line: staffLine, y: staffLine.coords.interpolateY(p.x), pos: MusicSymbolPositionInStaff.Undefined});
    }
    yOnStaff.sort((n1, n2) => n1.y - n2.y);
    yOnStaff[yOnStaff.length - 1].pos = yOnStaff[yOnStaff.length - 1].line.space ? MusicSymbolPositionInStaff.Space_1 : MusicSymbolPositionInStaff.Line_1;
    for (let i = yOnStaff.length - 2; i >= 0; i--) {
      if (yOnStaff[i + 1].line.space === yOnStaff[i].line.space) {
        yOnStaff[i].pos = yOnStaff[i + 1].pos + 2;
      } else {
        yOnStaff[i].pos = yOnStaff[i + 1].pos + 1;
      }
    }

    const preLineIdx = yOnStaff.findIndex((l, i) => l.y > p.y);

    let last, prev;
    if (preLineIdx === -1) {
      // bot
      last = yOnStaff[yOnStaff.length - 1];
      prev = yOnStaff[yOnStaff.length - 2];
    } else if (preLineIdx === 0) {
      last = yOnStaff[preLineIdx + 1];
      prev = yOnStaff[preLineIdx];
    } else {
      last = yOnStaff[preLineIdx];
      prev = yOnStaff[preLineIdx - 1];
    }
    return this._interpStaffPos(p.y, prev.y, last.y, prev.line.space, last.line.space, prev.pos, last.pos, offset);

  }

  positionInStaff(p: Point): MusicSymbolPositionInStaff {
    return this._staffPos(p).pos;
  }

  snapToStaff(p: Point, offset: number = 0): number {
    return this._staffPos(p, offset).y;
  }

  interpolateToBottom(x: number) {
    if (this.staffLines.length === 0) { return this.AABB.bottom; }
    return this.sortedStaffLines()[this.staffLines.length - 1].coords.interpolateY(x);
  }

  staffLinesMinBound(): PolyLine {
    const staffLines = this.staffLines.filter(s => s.coords.length >= 1).sort((a, b) => a.coords.averageY() - b.coords.averageY());
    if (staffLines.length <= 1) { return new PolyLine([]); }
    const left = Math.max(...staffLines.map(s => s.coords.points[0].x));
    const right = Math.min(...staffLines.map(s => s.coords.points[s.coords.length - 1].x));
    return new PolyLine([...(staffLines[0].coords.points),
      new Point(right, staffLines[0].coords.interpolateY(right)), new Point(right, staffLines[staffLines.length - 1].coords.interpolateY(right)),
      ...(staffLines[staffLines.length - 1].coords.copy().points.reverse()),
      new Point(left, staffLines[staffLines.length - 1].coords.interpolateY(left)), new Point(left, staffLines[0].coords.interpolateY(left)),
    ]);
  }

  /*
   * Symbols
   * ===================================================================================================
   */
  get symbols(): Array<MusicSymbol> { return this._symbols; }

  get additionalSymbols(): Array<MusicSymbol> {return this._additionalSymbols}

  symbolPositionsPolyline(): PolyLine { return new PolyLine(this._symbols.map(s => s.coord)); }

  filterSymbols(type: SymbolType) { return this._symbols.filter(s => s.symbol === type); }

  getNotes(): Array<Note> { return this.filterSymbols(SymbolType.Note) as Array<Note>; }

  getClefs(): Array<Clef> { return this.filterSymbols(SymbolType.Clef) as Array<Clef>; }

  getAccids(): Array<Accidental> { return this.filterSymbols(SymbolType.Accid) as Array<Accidental>; }

  hasSymbol(symbol: MusicSymbol) { return this._symbols.indexOf(symbol) >= 0; }
  hasDebugSymbol(symbol: MusicSymbol) { return this._additionalSymbols.indexOf(symbol) >= 0; }

  addSymbol(symbol: MusicSymbol, idx: number = -1) {
    if (!symbol || this.hasSymbol(symbol)) { return; }
    if (idx < 0) {
      if (symbol.debugSymbol) {
        this._additionalSymbols.push(symbol);
      } else {
        this._symbols.push(symbol);
      }
    } else {
      if (symbol.debugSymbol) {
        this._additionalSymbols.splice(idx, 0, symbol);
      } else {
        this._symbols.splice(idx, 0, symbol);
      }
    }
    symbol.attach(this);
  }
  addDebugSymbol(symbol: MusicSymbol, idx: number = -1) {
    if (!symbol || this.hasDebugSymbol(symbol)) { return; }
    if (idx < 0) {
      this._additionalSymbols.push(symbol);
    } else {
      this._additionalSymbols.splice(idx, 0, symbol);
    }
    symbol.attach(this);
  }
  removeDebugSymbol(symbol: MusicSymbol) {
    if (!symbol || !this.hasDebugSymbol(symbol)) { return; }
    this._additionalSymbols.splice(this._additionalSymbols.indexOf(symbol), 1);
    symbol.detach();
  }
  removeSymbol(symbol: MusicSymbol) {
    if (!symbol || !this.hasSymbol(symbol)) { return; }
    this._symbols.splice(this._symbols.indexOf(symbol), 1);
    symbol.detach();
  }

  sortSymbol(symbol: MusicSymbol): void {
    if (this._symbols.length <= 1) { return; }
    const idx = this._symbols.indexOf(symbol);
    if (idx < 0) { return; }
    let startIdx = idx;
    while (startIdx > 0 && this._symbols[startIdx].fixedSorting) { startIdx--; }
    const endIdx = this._symbols.findIndex((s, i) => i > idx && !s.fixedSorting);
    const toInsert = this._symbols.splice(startIdx, (endIdx < 0) ? 1 : endIdx - startIdx);
    if (symbol.coord.x < this._symbols[0].coord.x && !this._symbols[0].fixedSorting) {
      this._symbols.splice(0, 0, ...toInsert);
      return;
    }
    for (let i = 0; i < this._symbols.length; ++i) {
      if (this._symbols[i].coord.x > symbol.coord.x && !this._symbols[i].fixedSorting) {
        this._symbols.splice(i, 0, ...toInsert);
        return;
      }
    }
    this._symbols.push(...toInsert);
  }

  closestSymbolToX(x: number, type: SymbolType = null, leftOnly = false, rightOnly = false): MusicSymbol {
    let bestD = 1000000;
    let bestS = null;
    if (leftOnly) {
      this._symbols.forEach(symbol => {
        if ((type === null || type === symbol.symbol) && x - symbol.coord.x < bestD && x > symbol.coord.x) {
          bestD = Math.abs(x - symbol.coord.x);
          bestS = symbol;
        }
      });
    } else if (rightOnly) {
      this._symbols.forEach(symbol => {
        if ((type === null || type === symbol.symbol) && symbol.coord.x - x < bestD && x < symbol.coord.x) {
          bestD = Math.abs(x - symbol.coord.x);
          bestS = symbol;
        }
      });
    } else {
      this._symbols.forEach(symbol => {
        if ((type === null || type === symbol.symbol) && Math.abs(x - symbol.coord.x) < bestD) {
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
      const logicalConnectionStart = cur.isNeumeStart || (prev && !(prev instanceof Note)) || !prev;
      const next = (i < this.symbols.length - 1) ? this.symbols[i + 1] : null;
      const logicalConnectionEnd = !next || (next && !(next instanceof Note));


      if (logicalConnectionStart) {
        if (prev) {
          if (!prev || (prev && !(prev instanceof Note))) {
            out.push(new LogicalConnection(getBottomCoord(prev.coord.add(cur.coord).scale(0.5)), height, null, cur));
          } else if (cur.isNeumeStart) {
            // only the intermediate lines can be moved or deleted!
            out.push(new LogicalConnection(getBottomCoord(prev.coord.add(cur.coord).scale(0.5)), height, cur, cur));
          }
        } else {
          out.push(new LogicalConnection(getBottomCoord(cur.coord.translate(new Size(-tailOffset, 0))), height, null, cur));
        }
      }
      if (logicalConnectionEnd) {
        if (next) {
          out.push(new LogicalConnection(getBottomCoord(cur.coord.add(next.coord).scale(0.5)), height, null, null));
        } else {
          out.push(new LogicalConnection(getBottomCoord(cur.coord.translate(new Size(tailOffset, 0))), height, null, cur));
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

  syllableById(id: string): Syllable {
    return this.sentence.syllables.find(s => s.id === id);
  }

  cleanSyllables(): void {
    this.sentence = new Sentence();
  }

  refreshTextIds() {
    this.sentence.refreshIds();
  }
}
