import { EventEmitter, Injectable, Output, Directive } from '@angular/core';
import {
  CommandAcceptSymbol,
  CommandAttachLine,
  CommandAttachRegion,
  CommandAttachStaffLine,
  CommandAttachSymbol,
  CommandChangeSyllable,
  CommandCreateBlock,
  CommandCreateLine,
  CommandCreateStaffLine,
  CommandDeleteStaffLine,
  CommandDetachSymbol,
  CommandMoveInReadingOrder,
  CommandUpdateReadingOrder
} from '../undo/data-type-commands';
import {Point, PolyLine} from '../../geometry/geometry';
import {copyList, copySet} from '../../utils/copy';
import {CommandChangeArray, CommandChangeProperty, CommandChangeSet} from '../undo/util-commands';
import {
  AccidentalType, AdvancedSymbolClass, AdvancedSymbolColor,
  BlockType,
  ClefType,
  EmptyRegionDefinition,
  GraphicalConnectionType,
  NoteType,
  SymbolType,
} from '../../data-types/page/definitions';
import {Page} from '../../data-types/page/page';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {ActionCaller, Command} from '../undo/commands';
import {CommandChangePoint, CommandChangePolyLine} from '../undo/geometry_commands';
import {MusicSymbol, Note, SymbolConfidence} from '../../data-types/page/music-region/symbol';
import {Annotations, Connection, SyllableConnector} from '../../data-types/page/annotations';
import {Syllable} from '../../data-types/page/syllable';
import {ActionType} from './action-types';
import {Block} from '../../data-types/page/block';
import {PageLine} from '../../data-types/page/pageLine';
import {Region} from '../../data-types/page/region';
import {ViewChangesService} from './view-changes.service';
import {RequestChangedViewElements} from './changed-view-elements';
import {Sentence} from '../../data-types/page/sentence';
import {UserComment, UserCommentHolder, UserComments} from '../../data-types/page/userComment';
import {PageEditingProgress, PageProgressGroups} from '../../data-types/page-editing-progress';
import {CommandSetLock} from '../undo/lock-commands';

const leven = require('leven');


@Directive()
@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  @Output() actionCalled = new EventEmitter<ActionType>();
  private readonly _actionCaller = new ActionCaller(this.viewChanges);

  constructor(
    private viewChanges: ViewChangesService
  ) { }

  get caller() { return this._actionCaller; }

  redo() { this._actionCaller.redo(); this.actionCalled.emit(ActionType.Redo); }
  undo() { this._actionCaller.undo(); this.actionCalled.emit(ActionType.Undo); }
  reset() { this._actionCaller.reset(); }
  startAction(action: ActionType, changedViewElements: RequestChangedViewElements = []) {
    this.caller.startAction(action, changedViewElements);
  }
  finishAction(updateCallback: () => void = null) {
    const a = this.caller.finishAction(updateCallback);
    if (a) { this.actionCalled.emit(a.type); }
  }
  isActionActive() { return this.caller.isActionActive; }
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
  spliceArray<T>(v: Array<T>, index: number, deleteCount: number, ...insert: T[]) {
    const n = copyList(v);
    const deleted = v.splice(index, deleteCount, ...insert);
    this.changeArray2(v, n);
    return deleted;
  }
  changeProperty<T>(obj: any, property: string, from: T, to: T) { this.caller.runCommand(new CommandChangeProperty(obj, property, from, to));  }

  // page lock
  actionLockAll(pageEditingProgress: PageEditingProgress, lock: boolean = true) {
    this.startAction(ActionType.LockAll);
    Object.values(PageProgressGroups).forEach(group => this.caller.runCommand(new CommandSetLock(pageEditingProgress, group as PageProgressGroups, lock)));
    this.finishAction();
  }
  actionLockToggle(pageEditingProgress: PageEditingProgress, group: PageProgressGroups) {
    if (pageEditingProgress.getLocked(group)) {
      this.startAction(ActionType.Unlocked);
      this.caller.runCommand(new CommandSetLock(pageEditingProgress, group, false));
    } else {
      this.startAction(ActionType.Locked);
      this.caller.runCommand(new CommandSetLock(pageEditingProgress, group, true));
    }
    this.finishAction();
  }

  // geometry
  changePoint(p: Point, from: Point, to: Point) { this.caller.runCommand(new CommandChangePoint(p, from, to)); }
  changePoint2(p: Point, init: Point) { this.caller.runCommand(new CommandChangePoint(p, init, p)); }
  changePolyLine(pl: PolyLine, from: PolyLine, to: PolyLine) { this.caller.runCommand(new CommandChangePolyLine(pl, from, to)); }
  changePolyLine2(pl: PolyLine, init: PolyLine) { this.caller.runCommand(new CommandChangePolyLine(pl, init, pl)); }


  // blocks
  addNewBlock(page: Page, type: BlockType) {
    this.caller.pushChangedViewElement(page);

    const cmd = new CommandCreateBlock(page, type);
    this.caller.runCommand(cmd);
    return cmd.block;
  }

  attachRegion(parent: Region, region: Region) {
    if (region instanceof PageLine) {
      this.attachLine(parent as Block, region as PageLine);
    } else {
      this.caller.pushChangedViewElement(parent);
      this.caller.pushChangedViewElement(region.parent);
      this.caller.runCommand(new CommandAttachRegion(region, parent));
    }
  }

  detachRegion(region: Region) {
    this.removeComment((region.parentOfType(Page) as Page).userComments.getByHolder(region));
    if (region instanceof PageLine) {
      this.detachLine(region as PageLine);
    } else if (region instanceof Block) {
      this.detachBlock(region as Block);
    } else {
      this.attachRegion(null, region);
    }
  }

  addNewLine(block: Block) {
    this.caller.pushChangedViewElement(block);
    const cmd = new CommandCreateLine(block);
    this.caller.runCommand(cmd);
    this.updateReadingOrder(block.page);
    return cmd.line;
  }

  attachLine(block: Block, line: PageLine) {
    const page = block ? block.page : line.block.page;
    this.caller.pushChangedViewElement(block);
    this.caller.pushChangedViewElement(line.block);
    this.caller.runCommand(new CommandAttachLine(line, line.block, block));
    this.updateReadingOrder(page);
  }

  detachLine(line: PageLine) {
    this.removeComment(line.block.page.userComments.getByHolder(line));
    this.attachLine(null, line);
  }

  detachBlock(block: Block) {
    this.removeComment(block.page.userComments.getByHolder(block));
    block.page.annotations.findConnectorsByBlock(block).forEach(c => this.annotationRemoveConnection(c));
    this.attachRegion(null, block);
  }

  // Staff Line

  clearAllStaves(page: Page) {
    page.filterBlocks(BlockType.Music).forEach(b => {
      this.detachRegion(b);
    });
  }

  addNewStaffLine(musicLine: PageLine, polyLine: PolyLine) {
    this.caller.pushChangedViewElement(musicLine);
    const cmd = new CommandCreateStaffLine(musicLine, polyLine);
    this.caller.runCommand(cmd);
    this.updateAverageStaffLineDistance(musicLine);
    return cmd.staffLine;
  }

  deleteStaffLine(staffLine: StaffLine) {
    const oldLine = staffLine.staff;
    this.removeComment(staffLine.staff.block.page.userComments.getByHolder(staffLine));
    this.caller.pushChangedViewElement(staffLine);
    this.caller.runCommand(new CommandDeleteStaffLine(staffLine));
    this.updateAverageStaffLineDistance(oldLine);
  }

  attachStaffLine(newMusicLine: PageLine, staffLine: StaffLine) {
    const oldLine = staffLine.staff;
    this.caller.pushChangedViewElement(newMusicLine);
    this.caller.pushChangedViewElement(staffLine.staff);
    this.caller.runCommand(new CommandAttachStaffLine(staffLine, staffLine.staff, newMusicLine));
    this.updateAverageStaffLineDistance(newMusicLine);
    this.updateAverageStaffLineDistance(oldLine);
  }

  sortStaffLines(staffLines: Array<StaffLine>) {
    if (staffLines.length === 0) { return; }
    staffLines.forEach(sl => this.caller.pushChangedViewElement(sl));
    this.caller.runCommand(new CommandChangeArray(staffLines, staffLines,
      staffLines.sort((a, b) => a.coords.averageY() - b.coords.averageY())));
    this.updateAverageStaffLineDistance(staffLines[0].staff);
  }

  updateAverageStaffLineDistance(staff: PageLine) {
    if (!staff) { return; }
    this.caller.pushChangedViewElement(staff);
    this.caller.runCommand(new CommandChangeProperty(staff, 'avgStaffLineDistance',
      staff.avgStaffLineDistance, staff.computeAvgStaffLineDistance()));
  }

  changeStaffLineHighlight(s: StaffLine, b: boolean) {
    if (s) { this._actionCaller.runCommand(new CommandChangeProperty(s, 'highlighted', s.highlighted, b)); }
    this._actionCaller.pushChangedViewElement(s);
  }
  changeStaffDryPointLine(s: StaffLine, b: boolean) {
    if (s) { this._actionCaller.runCommand(new CommandChangeProperty(s, 'dryPointLine', s.dryPointLine, b)); }
    this._actionCaller.pushChangedViewElement(s);
  }
  changeStaffLineSpace(s: StaffLine, b: boolean) {
    if (s) {
      this._actionCaller.runCommand(new CommandChangeProperty(s, 'space', s.space, b));
      this.updateAverageStaffLineDistance(s.staff);
    }
    this._actionCaller.pushChangedViewElement(s);
  }

  // general page
  cleanLine(line: PageLine) {
    const staffLinesBefore = copyList(line.staffLines);
    line.staffLines.filter(s => s.coords.points.length === 0).forEach(s => s.detachFromParent());
    this.caller.runCommand(new CommandChangeArray(line.staffLines, staffLinesBefore, line.staffLines));
  }

  cleanBlock(block: Block, flags = EmptyRegionDefinition.Default) {
    block.lines.forEach(l => this.cleanLine(l));
    block.lines.filter(l => l.isEmpty(flags)).forEach(l => this.detachLine(l));
  }

  cleanPage(page: Page, flags = EmptyRegionDefinition.Default,
            includeBlockTypes: Set<BlockType> = null,
            excludeBlockTypes: Set<BlockType> = null): void {
    let blocks = page.blocks;
    if (excludeBlockTypes) {
      blocks = page.blocks.filter(b => !excludeBlockTypes.has(b.type));
    }
    if (includeBlockTypes) {
      blocks = blocks.filter(b => includeBlockTypes.has(b.type));
    }

    blocks.forEach(block => {
      this.cleanBlock(block, flags);
    });
    blocks.filter(b => b.isEmpty(flags)).forEach(b => this.detachRegion(b));
  }

  clearPage(page: Page): void {
    this.caller.pushChangedViewElement(page);
    page.children.map(b => b).forEach(b => this.detachRegion(b));
    this.clearAllAnnotations(page.annotations);
    this.updateReadingOrder(page, true);
    this.changeArray(page.userComments.comments, page.userComments.comments, []);
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

  clearAllLayout(page: Page) {
    page.textRegions.filter(cp => cp.isNotEmpty())
      .forEach(mr => {this.detachRegion(mr)}
      );
    page.musicRegions.filter(cp => cp.isNotEmpty())
      .forEach(mr => {
        this.removeComment((mr.parentOfType(Page) as Page).userComments.getByHolder(mr));
        mr.lines.forEach( ml => {
          this.changePolyLine(ml.coords, ml.coords, new PolyLine([]));
          this.caller.pushChangedViewElement(ml);
          this.viewChanges.request([ml]);
        });
      });
    page.readingOrder._updateReadingOrder(true);
    this.clearAllAnnotations(page.annotations);
  }

  // symbols
  clearAllSymbols(page: Page) {
    page.musicRegions.forEach(mr =>
      mr.musicLines.forEach(ml => { while (ml.symbols.length > 0) {
        this.detachSymbol(ml.symbols[0], page.annotations);
      }                             while (ml.additionalSymbols.length > 0) {
        this.detachSymbol(ml.additionalSymbols[0], page.annotations);
      } })
    );
  }

  updateSymbolSnappedCoord(s: MusicSymbol) {
    if (!s) { return; }
    this._actionCaller.pushChangedViewElement(s);
    this.changePoint(s.snappedCoord, s.snappedCoord, s.computeSnappedCoord());
  }

  acceptAdditionalSymbol(s: MusicSymbol) {
    if (s) {
      this._actionCaller.pushChangedViewElement(s.staff);
      this._actionCaller.runCommand(new CommandAcceptSymbol(s));
    }
  }

  attachSymbol(ml: PageLine, s: MusicSymbol) { if (ml && s) {
    this._actionCaller.pushChangedViewElement(ml);
    this._actionCaller.runCommand(new CommandAttachSymbol(s, ml)); }
  }
  detachSymbol(s: MusicSymbol, annotations: Annotations) { if (s) {
    this._actionCaller.pushChangedViewElement(s.staff);
    this.removeComment(s.staff.block.page.userComments.getByHolder(s));
    if (s instanceof Note) {
      const sc = annotations.findSyllableConnectorByNote(s as Note);
      if (sc) {
        this.connectionRemoveSyllableConnector(sc);
      }
    }
    this._actionCaller.runCommand(new CommandDetachSymbol(s));
  }}

  sortSymbolIntoStaff(s: MusicSymbol) {
    const prevSymbols = copyList(s.staff.symbols);
    s.staff.sortSymbol(s);
    this.changeArray2(s.staff.symbols, prevSymbols);
  }

  changeFixedSorting(s: MusicSymbol, b: boolean) {
    this._actionCaller.pushChangedViewElement(s);
    if (s) {
      this._actionCaller.runCommand(new CommandChangeProperty(s, 'fixedSorting', s.fixedSorting, b));
      this.sortSymbolIntoStaff(s);
    }
  }

  changeSymbolType(s: MusicSymbol, newSt: SymbolType, subType: NoteType|ClefType|AccidentalType): MusicSymbol {
    if (!s) { return s; }
    if (newSt === s.symbol && subType === s.subType) { return s; }
    const intermediate = s.toJson();
    intermediate.type = newSt;
    intermediate.clefType = subType;
    intermediate.noteType = subType;
    intermediate.accidType = subType;
    const n = MusicSymbol.fromJson(intermediate);
    this.attachSymbol(s.staff, n);
    this.detachSymbol(s, s.staff.block.page.annotations);
    this.sortSymbolIntoStaff(n);
    return n;
  }

  // note


  changeNoteType(n: Note, t: NoteType) {
    this._actionCaller.pushChangedViewElement(n);
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'type', n.type, t)); }
  }
  changeSymbolAdvancedType(n: MusicSymbol, t: AdvancedSymbolClass) {
    this._actionCaller.pushChangedViewElement(n);
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'advancedSymbolClass', n.advancedSymbolClass, t)); }
  }
  changeSymbolAdvancedColor(n: MusicSymbol, t: AdvancedSymbolColor) {
    this._actionCaller.pushChangedViewElement(n);
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'advancedSymbolColor', n.advancedSymbolColor, t)); }
  }
  removeNoteErrorType(n: SymbolConfidence, note: MusicSymbol) {
    //const intermediate = {...n.symbolConfidence};
    //intermediate.symbolErrorType = null;
    //intermediate.
    this._actionCaller.pushChangedViewElement(note);

    if (n) {this._actionCaller.runCommand(new CommandChangeProperty(n, 'symbolErrorType', n.symbolErrorType, null )); }
  }

  changeGraphicalConnection(n: Note, t: GraphicalConnectionType) {
    if (t === GraphicalConnectionType.NeumeStart) {
      return this.changeNeumeStart(n, true);
    }
    this._actionCaller.pushChangedViewElement(n);
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'graphicalConnection', n.graphicalConnection, t)); }
  }
  changeNeumeStart(n: Note, start: boolean) {
    this._actionCaller.pushChangedViewElement(n);
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'isNeumeStart', n.isNeumeStart, start)); }
  }

  changeMissing(n: Note, start: boolean) {
    this._actionCaller.pushChangedViewElement(n);
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'missing', n.missing, start)); }
  }
  // annotations
  annotationAddSyllableNeumeConnection(annotations: Annotations, neume: Note, syllable: Syllable): SyllableConnector {
    // this.caller.pushChangedViewElement()
    if (!neume || !syllable) { return; }

    const block = neume.staff.getBlock();
    let line: PageLine = null;
    const tr = annotations.page.textRegions.filter(t => t.type === BlockType.Lyrics).find(
      t => {line = t.textLines.find(tl => tl.sentence.hasSyllable(syllable));
        return line !== undefined; }
    );
    if (block === undefined) { console.error('Note without a music region', neume); return; }
    if (tr === undefined) { console.error('Syllable without a text region', syllable); return; }

    const c = this.annotationGetOrCreateConnection(annotations, block, tr);
    const s = this.connectionGetOrCreateSyllableConnector(c, syllable, neume, line);
    this.caller.pushChangedViewElement(neume, syllable);
    return s;
  }

  annotationGetOrCreateConnection(annotations: Annotations, mr: Block, tr: Block) {
    const c = annotations.connections.find(co => co.musicRegion === mr && co.textRegion === tr);
    if (c) { return c; }
    this.caller.pushChangedViewElement(mr);
    this.caller.pushChangedViewElement(tr);
    this.pushToArray(annotations.connections, new Connection(annotations, mr, tr));
    return annotations.connections[annotations.connections.length - 1];
  }

  annotationRemoveConnection(connection: Connection) {
    if (!connection) { return; }
    this.caller.pushChangedViewElement(connection.textRegion, connection.musicRegion);
    this.removeFromArray(connection.annotations.connections, connection);
  }

  connectionGetOrCreateSyllableConnector(connection: Connection, s: Syllable, n: Note, tl: PageLine) {
    const syl = connection.syllableConnectors.find(sc => sc.syllable === s);
    if (syl) { return syl; }
    this.caller.pushChangedViewElement(n, s, tl, connection.musicRegion, connection.textRegion);
    this.pushToArray(connection.syllableConnectors, new SyllableConnector(connection, s, n, tl));
    return connection.syllableConnectors[connection.syllableConnectors.length - 1];
  }

  connectionRemoveSyllableConnector(syllableConnector: SyllableConnector) {
    if (!syllableConnector) { return; }
    this.caller.pushChangedViewElement(syllableConnector.syllable, syllableConnector.connection.textRegion, syllableConnector.connection.musicRegion);
    this.removeFromArray(syllableConnector.connection.syllableConnectors, syllableConnector);
    if (syllableConnector.connection.syllableConnectors.length === 0) { this.annotationRemoveConnection(syllableConnector.connection); }
  }

  clearAllAnnotations(annotations: Annotations) {
    if (!annotations) { return; }
    annotations.connections.forEach(c => {
      this.caller.pushChangedViewElement(c.textRegion, c.musicRegion);
    });
    this.changeArray(annotations.connections, annotations.connections, []);
  }

  // layout operations
  addPolyLinesAsPageLine(actionType: ActionType, polyLines: Array<PolyLine>, originLine: PageLine, page: Page, type: BlockType) {
    if (polyLines.length === 0) { return; }
    this.startAction(actionType, [originLine]);

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
      this.caller.pushChangedViewElement(fr);
    });

    this.finishAction();
  }


  // reading order
  updateReadingOrder(page: Page, clean = false) {
    this.caller.pushChangedViewElement(page);
    this.caller.runCommand(new CommandUpdateReadingOrder(page.readingOrder, clean));
    this.updateSyllablePrefix(page);
    if (clean) {
      page.blocks.forEach(b => this.computeReadingOrder(b));
    }
  }

  computeReadingOrder(block: Block) {
    this.changeArray(block.children, block.children, copyList(block.children).sort((a, b) => {
      if ((a.AABB.bottom > b.AABB.vcenter() && a.AABB.top < b.AABB.vcenter()) ||
        (b.AABB.bottom > a.AABB.vcenter() && b.AABB.top < a.AABB.vcenter())) {
        return a.AABB.hcenter() - b.AABB.hcenter();
      }
      return a.AABB.vcenter() - b.AABB.vcenter();
    }));
  }

  moveItemInReadingOrder(page: Page, fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) { return; }
    const ro = page.readingOrder.readingOrder;
    if (ro.length <= fromIdx || ro.length <= toIdx || fromIdx < 0 || toIdx < 0) { return; }
    this.caller.pushChangedViewElement(page);
    this.caller.runCommand(new CommandMoveInReadingOrder(page.readingOrder, fromIdx, toIdx));
    this.updateSyllablePrefix(page);
  }

  updateSyllablePrefix(page: Page) {
    this.caller.pushChangedViewElement(page);
    page.blocks.forEach(b => b.lines.map(l => l.sentence).filter(s => s.syllables.length > 0)
      .filter(s => s.syllables[0].prefix.length > 0)
      .forEach(s => this.caller.runCommand(new CommandChangeProperty(s.syllables[0], 'prefix', s.syllables[0].prefix, '')))
    );
    let lastDropCapitalText = '';
    page.readingOrder.readingOrder.forEach(pl => {
      if (pl.block.type === BlockType.DropCapital) {
        lastDropCapitalText += pl.sentence.text;
      } else {
        if (pl.sentence.syllables.length > 0) {
          const s = pl.sentence.syllables[0];
          this.caller.runCommand(new CommandChangeProperty(s, 'prefix', s.prefix, lastDropCapitalText));
        }
        lastDropCapitalText = '';
      }
    });
  }

  updateSyllablePrefixOfLine(pageLine: PageLine) {
    this.caller.pushChangedViewElement(pageLine);
    const readingOrder = pageLine.block.page.readingOrder.readingOrder;
    if (pageLine.blockType === BlockType.Lyrics) {
      // remove old prefixes
      pageLine.sentence.syllables.slice(1).forEach(
        syllable => {
          if (syllable.prefix.length > 0) {
            this.caller.runCommand(new CommandChangeProperty(syllable, 'prefix', syllable.prefix, ''));
          }
        }
      );

      // add prefix to first syllable
      const s = pageLine.sentence.syllables[0];
      let newPrefix = '';
      let idx = readingOrder.indexOf(pageLine);
      if (!s || idx < 0) {
        return;
      }
      for (idx -= 1; idx >= 0; idx--) {
        const line = readingOrder[idx];
        if (line.blockType === BlockType.DropCapital) {
          newPrefix = line.sentence.text + newPrefix;
        } else {
          break;
        }
      }

      this.caller.runCommand(new CommandChangeProperty(s, 'prefix', s.prefix, newPrefix));
    } else if (pageLine.blockType === BlockType.DropCapital) {
      const idx = readingOrder.indexOf(pageLine);
      if (idx < 0 || idx === readingOrder.length - 1) { return; }
      this.updateSyllablePrefixOfLine(readingOrder[idx + 1]);
    }
  }



  // lyrics
  clearAllTexts(page: Page): void {
    this.caller.pushChangedViewElement(page);
    page.blocks.forEach(b => b.lines.forEach(
      l => {
        this.changeArray(l.sentence.syllables, l.sentence.syllables, []);
      }
    ));
    this.clearAllAnnotations(page.annotations);
  }

  changeLyrics(pageLine: PageLine, newSentence: Sentence, force: boolean = false) {
    const thisSentence = pageLine.sentence;
    const startAction = !this.caller.isActionActive;
    if (startAction) {
      this.startAction(ActionType.LyricsEdit);
    }

    this.caller.pushChangedViewElement(pageLine);
    if (thisSentence.syllables.length === 0 || force) {
      this.changeArray(thisSentence.syllables, thisSentence.syllables, newSentence.syllables);
      if (startAction) {
        this.finishAction();
      }
      return;
    }

    let startSyllables = 0;
    let endSyllables = 0;
    const minSyllablesLength = Math.min(thisSentence.syllables.length, newSentence.syllables.length);
    for (; startSyllables < minSyllablesLength; startSyllables++) {
      if (!thisSentence.syllables[startSyllables].equals(newSentence.syllables[startSyllables])) {
        break;
      }
    }

    for (; endSyllables < minSyllablesLength; endSyllables++) {
      if (!thisSentence.syllables[thisSentence.syllables.length - endSyllables - 1].equals(
        newSentence.syllables[newSentence.syllables.length - endSyllables - 1])) {
        break;
      }
    }

    const deletedSyllabes = new Array<Syllable>();
    const startSyllable = {this: thisSentence.syllables[startSyllables], new: newSentence.syllables[startSyllables]};
    const endSyllable = {
      this: thisSentence.syllables[thisSentence.syllables.length - endSyllables - 1],
      new: newSentence.syllables[newSentence.syllables.length - endSyllables - 1],
    };


    while (startSyllables + endSyllables < Math.min(newSentence.syllables.length, thisSentence.syllables.length)) {
      // pick the best syllable (start or end)
      const startLeven = (startSyllable.this && endSyllable.new) ? leven(startSyllable.this.text, startSyllable.new.text) : 10000;
      const endLeven = (endSyllable.this && endSyllable.new) ? leven(endSyllable.this.text, endSyllable.new.text) : 10000;
      if (startLeven < 10000 && endLeven < 10000) {
        if (startLeven > endLeven) {
          this._actionCaller.runCommand(new CommandChangeSyllable(endSyllable.this, endSyllable.new));
          endSyllable.this.copyFrom(endSyllable.new);
          endSyllables += 1;
          continue;
        } else {
          this._actionCaller.runCommand(new CommandChangeSyllable(startSyllable.this, startSyllable.new));
          startSyllables += 1;
          continue;
        }
      }
      break;
    }


    const thisSyllables = copyList(thisSentence.syllables);
    const deleted = thisSyllables.splice(startSyllables, thisSentence.syllables.length - endSyllables - startSyllables, ...newSentence.syllables.slice(startSyllables, newSentence.syllables.length - endSyllables));
    deleted.forEach(s => deletedSyllabes.push(s));

    this.changeArray(thisSentence.syllables, thisSentence.syllables, thisSyllables);

    const anno = pageLine.getBlock().page.annotations;
    deletedSyllabes.forEach(syllable => this.connectionRemoveSyllableConnector(anno.findSyllableConnector(pageLine, syllable)));

    this.updateSyllablePrefixOfLine(pageLine);

    if (startAction) {
      this.finishAction();
    }
  }

  // Syllables
  removeSyllable(sentence: Sentence, syllable: Syllable) {
    if (!sentence || !syllable || !sentence.hasSyllable(syllable)) { return; }
    this.changeArray(sentence.syllables, sentence.syllables, sentence.syllables.filter(s => s !== syllable));
  }
  insertSyllable(sentence: Sentence, syllable: Syllable, targetSyllable: Syllable = null, pos: number = 1) {
    if (pos < 0) { pos = 0; }
    if (!sentence || !syllable) { return; }
    const syllables = copyList(sentence.syllables);
    if (targetSyllable) {
      const idx = syllables.indexOf(targetSyllable);
      syllables.splice(idx + pos, 0, syllable);
    } else if (pos > 0) {
      syllables.splice(syllables.length, 0, syllable);
    } else {
      syllables.splice(0, 0, syllable);
    }
    this.changeArray(sentence.syllables, sentence.syllables, syllables);
  }
  moveSyllable(target: PageLine, source: PageLine, syllable: Syllable, targetSyllable: Syllable = null, pos: number = 1) {
    const targetSentence = target.sentence;
    const sourceSentence = source.sentence;
    if (!sourceSentence.hasSyllable(syllable)) { return; }
    if (!targetSentence || ! sourceSentence || !syllable) { return; }
    this.removeSyllable(sourceSentence, syllable);
    this.insertSyllable(targetSentence, syllable, targetSyllable, pos);
    this.updateSyllablePrefixOfLine(target);
    if (target !== source) {
      this.updateSyllablePrefixOfLine(source);
    }
  }
  freeMoveSyllable(page: Page, syllableConnector: SyllableConnector, pos: Point): SyllableConnector {
    const closestNote = page.closesLogicalComponentToPosition(pos);
    if (!closestNote || !closestNote.isSyllableConnectionAllowed()) {
      return null;  // nothing we can do here
    }

    const containingLines = page.allTextLinesWithType(BlockType.Lyrics).filter(l => l.AABB.containsPoint(pos));
    const targetLine = containingLines.length > 0 ? containingLines[0] : null;
    return this.moveSyllableToNote(page, syllableConnector, closestNote, targetLine);
  }
  moveSyllableToNote(page: Page, syllableConnector: SyllableConnector, note: Note, targetTextLine: PageLine): SyllableConnector {
    const notes = note.staff.filterSymbols(SymbolType.Note).map(s => s as Note)
      .filter(n => n.isSyllableConnectionAllowed());
    let closestConnector: SyllableConnector = null;
    for (let i = notes.indexOf(note) - 1; i >= 0; i--) {
      closestConnector = page.annotations.findSyllableConnectorByNote(notes[i] as Note);
      if (closestConnector && closestConnector.textLine === targetTextLine) {
        break;
      }
      closestConnector = null;
    }

    if (closestConnector) {
      return this.moveSyllableAndSyllableConnector(syllableConnector, note, closestConnector.textLine, closestConnector.syllable, 1);
    } else {
      if (targetTextLine) {
        return this.moveSyllableAndSyllableConnector(syllableConnector, note, targetTextLine, null, 0);
      } else {
        return null;
      }
    }
  }

  moveSyllableAndSyllableConnector(syllable: SyllableConnector, targetNote: Note, target: PageLine,
                                   targetSyllable: Syllable = null, pos: number = 1) {
    this.moveSyllable(target, syllable.textLine, syllable.syllable, targetSyllable, pos);
    this.connectionRemoveSyllableConnector(syllable);
    return this.annotationAddSyllableNeumeConnection(target.block.page.annotations, targetNote, syllable.syllable);
  }

  // Comments
  addComment(userComments: UserComments, c: UserCommentHolder): UserComment {
    if (!c || !userComments) { return null; }
    let comment = userComments.getByHolder(c);
    if (comment) { return comment; }
    comment = new UserComment(userComments, c);
    this.caller.pushChangedViewElement(comment);
    this.pushToArray(userComments.comments, comment);
    return comment;
  }

  removeComment(c: UserComment) {
    if (!c) { return; }
    this.caller.pushChangedViewElement(c);
    this.removeFromArray(c.userComments.comments, c);
  }

  changeCommentText(c: UserComment, s: string) {
    if (!c) { return; }
    this._actionCaller.runCommand(new CommandChangeProperty(c, 'text', c.text, s));
    this.caller.pushChangedViewElement(c);
  }

}
