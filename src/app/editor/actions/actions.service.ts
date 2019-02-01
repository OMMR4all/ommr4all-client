import {EventEmitter, Injectable, Output} from '@angular/core';
import {
  CommandAttachLine,
  CommandAttachRegion,
  CommandAttachStaffLine,
  CommandAttachSymbol,
  CommandCreateBlock,
  CommandCreateLine,
  CommandCreateStaffLine,
  CommandDeleteStaffLine,
  CommandDetachSymbol
} from '../undo/data-type-commands';
import {Point, PolyLine} from '../../geometry/geometry';
import {copyList, copySet} from '../../utils/copy';
import {CommandChangeArray, CommandChangeProperty, CommandChangeSet} from '../undo/util-commands';
import {
  BlockType,
  EmptyRegionDefinition,
  GraphicalConnectionType,
} from '../../data-types/page/definitions';
import {Page} from '../../data-types/page/page';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {ActionCaller, Command} from '../undo/commands';
import {CommandChangePoint, CommandChangePolyLine} from '../undo/geometry_commands';
import {Note, Symbol} from '../../data-types/page/music-region/symbol';
import {Annotations, Connection, NeumeConnector, SyllableConnector} from '../../data-types/page/annotations';
import {Syllable} from '../../data-types/page/syllable';
import {ActionType} from './action-types';
import {Block} from '../../data-types/page/block';
import {PageLine} from '../../data-types/page/pageLine';
import {Region} from '../../data-types/page/region';


@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  @Output() actionCalled = new EventEmitter<ActionType>();
  private readonly _actionCaller = new ActionCaller();

  constructor(
  ) { }

  get caller() { return this._actionCaller; }

  redo() { this._actionCaller.redo(); this.actionCalled.emit(ActionType.Redo); }
  undo() { this._actionCaller.undo(); this.actionCalled.emit(ActionType.Undo); }
  reset() { this._actionCaller.reset(); }
  startAction(action: ActionType) { this.caller.startAction(action); }
  finishAction(updateCallback: () => void = null) {
    const a = this.caller.finishAction(updateCallback);
    if (a) { this.actionCalled.emit(a.type); }
  }
  run(cmd: Command) { this.caller.runCommand(cmd); }

  // general
  addToSet<T>(v: Set<T>, newElement: T) { const n = copySet(v); n.add(newElement); this.changeSet(v, v, n); }
  removeFromSet<T>(v: Set<T>, del: T) { const n = copySet(v); n.delete(del); this.changeSet(v, v, n); }
  changeSet<T>(v: Set<T>, from: Set<T>, to: Set<T>) { this.caller.runCommand(new CommandChangeSet(v, from, to)); }
  changeSet2<T>(v: Set<T>, initial: Set<T>) { this.caller.runCommand(new CommandChangeSet(v, initial, v)); }

  pushToArray<T>(a: Array<T>, newElement: T) { const n = copyList(a); n.push(newElement); this.changeArray(a, a, n); }
  removeFromArray<T>(v: Array<T>, del: T) { const idx = v.indexOf(del); if (idx >= 0) { const n = copyList(v); n.splice(idx, 1); this.changeArray(v, v, n); } }  // tslint:disable-line max-line-length
  changeArray<T>(v: Array<T>, from: Array<T>, to: Array<T>) { this.caller.runCommand(new CommandChangeArray(v, from, to)); }
  changeArray2<T>(v: Array<T>, initial: Array<T>) { this.caller.runCommand(new CommandChangeArray(v, initial, v)); }

  // geometry
  changePoint(p: Point, from: Point, to: Point) { this.caller.runCommand(new CommandChangePoint(p, from, to)); }
  changePoint2(p: Point, init: Point) { this.caller.runCommand(new CommandChangePoint(p, init, p)); }
  changePolyLine(pl: PolyLine, from: PolyLine, to: PolyLine) { this.caller.runCommand(new CommandChangePolyLine(pl, from, to)); }
  changePolyLine2(pl: PolyLine, init: PolyLine) { this.caller.runCommand(new CommandChangePolyLine(pl, init, pl)); }

  // blocks
  addNewBlock(page: Page, type: BlockType) {
    const cmd = new CommandCreateBlock(page, type);
    this.caller.runCommand(cmd);
    return cmd.block;
  }

  attachRegion(parent: Region, region: Region) {
    this.caller.runCommand(new CommandAttachRegion(region, parent));
  }

  detachRegion(region: Region) {
    this.attachRegion(null, region);
  }

  addNewLine(block: Block) {
    const cmd = new CommandCreateLine(block);
    this.caller.runCommand(cmd);
    return cmd.line;
  }

  attachLine(block: Block, line: PageLine) {
    this.caller.runCommand(new CommandAttachLine(line, line.getBlock(), block));
  }

  detachLine(line: PageLine) {
    this.attachLine(null, line);
  }

  // music regions

  addNewStaffLine(musicLine: PageLine, polyLine: PolyLine) {
    const cmd = new CommandCreateStaffLine(musicLine, polyLine);
    this.caller.runCommand(cmd);
    return cmd.staffLine;
  }

  deleteStaffLine(staffLine: StaffLine) {
    this.caller.runCommand(new CommandDeleteStaffLine(staffLine));
  }

  attachStaffLine(newMusicLine: PageLine, staffLine: StaffLine) {
    this.caller.runCommand(new CommandAttachStaffLine(staffLine, staffLine.staff, newMusicLine));
  }

  sortStaffLines(staffLines: Array<StaffLine>) {
    this.caller.runCommand(new CommandChangeArray(staffLines, staffLines,
      staffLines.sort((a, b) => a.coords.averageY() - b.coords.averageY())));
  }

  updateAverageStaffLineDistance(staff: PageLine) {
    this.caller.runCommand(new CommandChangeProperty(staff, 'avgStaffLineDistance',
      staff.avgStaffLineDistance, staff.computeAvgStaffLineDistance()));
  }

  // text regions
  cleanTextEquivs(line: PageLine): void {
    const textEquivsBefore = copyList(line.textEquivs);
    line.textEquivs = line.textEquivs.filter(te => te.content.length > 0);
    this.changeArray(line.textEquivs, textEquivsBefore, line.textEquivs);
  }


  // general page
  cleanLine(line: PageLine) {
    this.cleanTextEquivs(line);
    const staffLinesBefore = copyList(line.staffLines);
    line.staffLines.filter(s => s.coords.points.length === 0).forEach(s => s.detachFromParent());
    this.caller.runCommand(new CommandChangeArray(line.staffLines, staffLinesBefore, line.staffLines));
  }

  cleanBlock(block: Block, flags = EmptyRegionDefinition.Default) {
    block.lines.forEach(l => this.cleanLine(l));
    block.lines.filter(l => l.isEmpty(flags)).forEach(l => this.detachLine(l));
  }

  cleanPage(page: Page, flags = EmptyRegionDefinition.Default): void {
    page.blocks.forEach(block => {
      this.cleanBlock(block, flags);
    });
    page.blocks.filter(b => b.isEmpty(flags)).forEach(b => this.detachRegion(b));
  }

  clearPage(page: Page): void {
    page.children.map(b => b).forEach(b => this.detachRegion(b));
    this.changeArray(page.annotations.connections, page.annotations.connections, []);
  }

  removeCoords(coords: PolyLine, page: Page) {
    for (const b of page.blocks) {
      if (b.coords === coords) {
        this.detachRegion(b);
        return;
      }
      for (const l of b.lines) {
        if (l.coords === coords) {
          this.detachRegion(l);
          return;
        }
      }
    }

    console.warn('Cannot find polyline');
  }

  // symbols
  updateSymbolSnappedCoord(s: Symbol) {
    if (!s) { return; }
    this.changePoint(s.snappedCoord, s.snappedCoord, s.computeSnappedCoord());
  }

  attachSymbol(ml: PageLine, s: Symbol) { if (ml && s) { this._actionCaller.runCommand(new CommandAttachSymbol(s, ml)); } }
  detachSymbol(s: Symbol, annotations: Annotations) { if (s) {
    if (s instanceof Note) {
      const r = annotations.findNeumeConnector(s as Note);
      if (r) {
        this.syllableConnectorRemoveConnector(r.sc, r.nc);
      }
    }
    this._actionCaller.runCommand(new CommandDetachSymbol(s));
  }}

  sortSymbolIntoStaff(s: Symbol) {
    const prevSymbols = copyList(s.staff.symbols);
    s.staff.sortSymbol(s);
    this.changeArray2(s.staff.symbols, prevSymbols);
  }

  // note
  changeGraphicalConnection(n: Note, t: GraphicalConnectionType) {
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'graphicalConnection', n.graphicalConnection, t)); }
  }
  changeNeumeStart(n: Note, start: boolean) {
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'isNeumeStart', n.isNeumeStart, start)); }
  }

  // annotations
  annotationAddNeumeConnection(annotations: Annotations, neume: Note, syllable: Syllable) {
    if (!neume || !syllable) { return; }
    const block = neume.staff.getBlock();
    let line: PageLine = null;
    const tr = annotations.page.textRegions.filter(t => t.type === BlockType.Lyrics).find(
      t => {line = t.textLines.find(tl => tl.words.findIndex(w => w.syllabels.indexOf(syllable) >= 0) >= 0);
        return line !== undefined; }
    );
    if (block === undefined) { console.error('Note without a music region', neume); return; }
    if (tr === undefined) { console.error('Syllable without a text region', syllable); return; }

    const c = this.annotationGetOrCreateConnection(annotations, block, tr);
    const s = this.connectionGetOrCreateSyllableConnector(c, syllable);
    this.syllableConnectorGetOrCreateNeumeconnector(s, neume, line);
  }

  annotationGetOrCreateConnection(annotations: Annotations, mr: Block, tr: Block) {
    const c = annotations.connections.find(co => co.musicRegion === mr && co.textRegion === tr);
    if (c) { return c; }
    this.pushToArray(annotations.connections, new Connection(mr, tr));
    return annotations.connections[annotations.connections.length - 1];
  }

  connectionGetOrCreateSyllableConnector(connection: Connection, s: Syllable) {
    const syl = connection.syllableConnectors.find(sc => sc.syllable === s);
    if (syl) { return syl; }
    this.pushToArray(connection.syllableConnectors, new SyllableConnector(s));
    return connection.syllableConnectors[connection.syllableConnectors.length - 1];
  }

  syllableConnectorGetOrCreateNeumeconnector(sc: SyllableConnector, n: Note, tl: PageLine) {
    const nc = sc.neumeConnectors.find(c => c.neume === n);
    if (nc) { return nc; }
    this.pushToArray(sc.neumeConnectors, new NeumeConnector(n, tl));
    return sc.neumeConnectors[sc.neumeConnectors.length - 1];
  }

  syllableConnectorRemoveConnector(sc: SyllableConnector, n: NeumeConnector) {
    if (n) { this.removeFromArray(sc.neumeConnectors, n); }
  }



  // layout operations
  addPolyLinesAsPageLine(polyLines: Array<PolyLine>, originLine: PageLine, page: Page, type: BlockType) {
    if (polyLines.length === 0) { return; }
    this.startAction(ActionType.LayoutExtractCC);

    let foreigenRegions = new Array<PageLine>();
    let siblingRegions = new Array<PageLine>();

    if (originLine) { siblingRegions.push(originLine); }

    page.blocks.forEach(block => block.lines.filter(line => line !== originLine).forEach(line => {
      line.update();
      polyLines.forEach(pl => {
        if (pl.aabb().intersetcsWithRect(line.AABB) && PolyLine.multiUnionFilled([pl, line.coords]).length === 1) {
          foreigenRegions.push(line);
        }
      });
    }));

    // make arrays unique
    foreigenRegions = foreigenRegions.filter((v, i, a) => a.indexOf(v) === i);
    siblingRegions = siblingRegions.filter((v, i, a) => a.indexOf(v) === i);

    if (siblingRegions.length === 1) {
      const seCoords = siblingRegions.map(fr => fr.coords);
      const outPl = PolyLine.multiUnionFilled([...seCoords, ...polyLines]).filter(pl => pl.differenceSingle(seCoords[0]).points.length !== 0);
      if (outPl.length === 1) {
        this.changePolyLine(siblingRegions[0].coords, siblingRegions[0].coords, outPl[0]);
      } else {
        console.log('Warning');
      }
    } else if (type !== BlockType.Music) {
      const seCoords = siblingRegions.map(fr => fr.coords);
      const newBlock = this.addNewBlock(page, type);
      PolyLine.multiUnionFilled([...seCoords, ...polyLines]).forEach(pl => {
        const newLine = this.addNewLine(newBlock);
        newLine.coords = pl;
      });
      siblingRegions.forEach(sr => this.detachRegion(sr));
    }

    foreigenRegions.forEach(fr => {
      let toCoords = [fr.coords.copy()];
      polyLines.forEach(pl => {
        let pls = [pl];
        if (fr.getBlock().type === BlockType.Music) {
          // do not allow penetration into music region
          pls = pl.difference(fr.staffLinesMinBound());
        }
        pls.forEach(pll => {
          toCoords = [].concat(...toCoords.map(c => c.difference(pll)));
        });
      });
      toCoords = toCoords.filter(c => { const b = c.aabb(); return b.area > 200 && b.size.h >= 10 && b.size.w >= 10; });
      if (toCoords.length === 0) {
        this.detachRegion(fr);
      } else if (toCoords.length === 1) {
        if (toCoords[0].length === 0) {
          this.detachRegion(fr);
        } else {
          this.changePolyLine(fr.coords, fr.coords, toCoords[0]);
        }
      } else {
        const parent = fr.getBlock();
        if (parent.type === BlockType.Music) {
          this.changePolyLine(fr.coords, fr.coords, toCoords.sort((a, b) => b.aabb().area - a.aabb().area)[0]);
        } else {
          this.detachRegion(fr);
          toCoords.forEach(coords => {
            const l = this.addNewLine(parent);
            l.coords = coords;
          });
        }
      }
    });

    this.finishAction();
  }
}
