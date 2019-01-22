import {EventEmitter, Injectable, Output} from '@angular/core';
import {
  CommandAttachLine, CommandAttachRegion,
  CommandAttachStaffLine,
  CommandAttachSymbol, CommandCreateBlock, CommandCreateLine,
  CommandCreateStaffLine,
  CommandDeleteStaffLine,
  CommandDetachSymbol
} from '../undo/data-type-commands';
import {Point, PolyLine} from '../../geometry/geometry';
import {copyList, copySet} from '../../utils/copy';
import {CommandChangeArray, CommandChangeProperty, CommandChangeSet} from '../undo/util-commands';
import {
  BlockType,
  EmptyMusicRegionDefinition,
  EmptyTextRegionDefinition,
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

  cleanMusicLine(musicLine: PageLine): void {
    const staffLinesBefore = copyList(musicLine.staffLines);
    musicLine.staffLines.filter(s => s.coords.points.length === 0).forEach(s => s.detachFromParent());
    this.caller.runCommand(new CommandChangeArray(musicLine.staffLines, staffLinesBefore, musicLine.staffLines));
  }

  cleanMusicRegion(musicRegion: Block, flags = EmptyMusicRegionDefinition.Default): void {
    const musicLinesBefore = copyList(musicRegion.musicLines);
    musicRegion.musicLines.forEach(s => this.cleanMusicLine(s));
    this.caller.runCommand(new CommandChangeArray(musicRegion.musicLines, musicLinesBefore,
      musicRegion.musicLines.filter(s => s.isMusicLineNotEmpty(flags))));
  }

  cleanPageMusicRegions(page: Page, flags = EmptyMusicRegionDefinition.Default): void {
    page.musicRegions.forEach(m => {
      this.cleanMusicRegion(m, flags);
      if (m.isEmpty(flags)) {
        this.detachRegion(m);
      }
    });
  }

  // text regions
  cleanTextEquivs(line: PageLine): void {
    const textEquivsBefore = copyList(line.textEquivs);
    line.textEquivs = line.textEquivs.filter(te => te.content.length > 0);
    this.changeArray(line.textEquivs, textEquivsBefore, line.textEquivs);
  }

  cleanTextLine(textLine: PageLine): void {
    this.cleanTextEquivs(textLine);
  }

  cleanTextRegion(textRegion: Block, flags = EmptyTextRegionDefinition.Default): void {
    const textLinesBefore = copyList(textRegion.textLines);
    textRegion.textLines.forEach(s => this.cleanTextLine(s));
    this.changeArray(textRegion.textLines, textLinesBefore, textRegion.textLines.filter(s => s.isTextLineNotEmpty(flags)));
  }

  cleanPageTextRegions(page: Page, flags = EmptyTextRegionDefinition.Default): void {
    const textRegionsBefore = copyList(page.textRegions);
    page.textRegions.forEach(t => this.cleanTextRegion(t, flags));
    // TODO:
    // this.changeArray(page.textRegions, textRegionsBefore, page.textRegions.filter(m => m.is(flags)));
  }

  // general page
  cleanPage(page: Page): void {
    this.cleanPageMusicRegions(page);
    this.cleanPageTextRegions(page);
  }

  clearPage(page: Page): void {
    page.children.map(b => b).forEach(b => this.detachRegion(b));
    this.changeArray(page.annotations.connections, page.annotations.connections, []);
  }

  removeCoords(coords: PolyLine, page: Page) {
    for (const mr of page.musicRegions) {
      if (mr.coords === coords) {
        this.removeFromArray(page.musicRegions, mr);
        return;
      }
      for (const se of mr.musicLines) {
        if (se.coords === coords) {
          this.removeFromArray(mr.musicLines, se);
          return;
        }
      }
    }

    for (const tr of page.textRegions) {
      if (tr.coords === coords) {
        this.removeFromArray(page.textRegions, tr);
        return;
      }
      for (const tl of tr.textLines) {
        if (tl.coords === coords) {
          this.removeFromArray(tr.textLines, tl);
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


}
