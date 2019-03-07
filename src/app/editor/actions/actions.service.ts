import {EventEmitter, Injectable, Output} from '@angular/core';
import {
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
import {BlockType, EmptyRegionDefinition, GraphicalConnectionType,} from '../../data-types/page/definitions';
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
import {ViewChangesService} from './view-changes.service';
import {RequestChangedViewElements} from './changed-view-elements';
import {Sentence} from '../../data-types/page/word';

const leven = require('leven');


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
    if (region instanceof PageLine) {
      this.detachLine(region as PageLine);
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
    this.attachLine(null, line);
  }

  // Staff Line

  addNewStaffLine(musicLine: PageLine, polyLine: PolyLine) {
    this.caller.pushChangedViewElement(musicLine);
    const cmd = new CommandCreateStaffLine(musicLine, polyLine);
    this.caller.runCommand(cmd);
    this.updateAverageStaffLineDistance(musicLine);
    return cmd.staffLine;
  }

  deleteStaffLine(staffLine: StaffLine) {
    const oldLine = staffLine.staff;
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
    this._actionCaller.pushChangedViewElement(s);
    this.changePoint(s.snappedCoord, s.snappedCoord, s.computeSnappedCoord());
  }

  attachSymbol(ml: PageLine, s: Symbol) { if (ml && s) {
    this._actionCaller.pushChangedViewElement(ml);
    this._actionCaller.runCommand(new CommandAttachSymbol(s, ml)); }
  }
  detachSymbol(s: Symbol, annotations: Annotations) { if (s) {
    this._actionCaller.pushChangedViewElement(s.staff);
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
    this._actionCaller.pushChangedViewElement(n);
  }
  changeNeumeStart(n: Note, start: boolean) {
    if (n) { this._actionCaller.runCommand(new CommandChangeProperty(n, 'isNeumeStart', n.isNeumeStart, start)); }
    this._actionCaller.pushChangedViewElement(n);
  }

  // annotations
  annotationAddNeumeConnection(annotations: Annotations, neume: Note, syllable: Syllable) {
    // this.caller.pushChangedViewElement()
    if (!neume || !syllable) { return; }
    const block = neume.staff.getBlock();
    let line: PageLine = null;
    const tr = annotations.page.textRegions.filter(t => t.type === BlockType.Lyrics).find(
      t => {line = t.textLines.find(tl => tl.sentence.words.findIndex(w => w.syllables.indexOf(syllable) >= 0) >= 0);
        return line !== undefined; }
    );
    if (block === undefined) { console.error('Note without a music region', neume); return; }
    if (tr === undefined) { console.error('Syllable without a text region', syllable); return; }

    const c = this.annotationGetOrCreateConnection(annotations, block, tr);
    const s = this.connectionGetOrCreateSyllableConnector(c, syllable);
    this.caller.pushChangedViewElement(neume, syllable);
    return this.syllableConnectorGetOrCreateNeumeconnector(s, neume, line);
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
    this.caller.pushChangedViewElement(connection.textRegion);
    this.caller.pushChangedViewElement(connection.musicRegion);
    this.removeFromArray(connection.annotations.connections, connection);
  }

  connectionGetOrCreateSyllableConnector(connection: Connection, s: Syllable) {
    const syl = connection.syllableConnectors.find(sc => sc.syllable === s);
    if (syl) { return syl; }
    this.pushToArray(connection.syllableConnectors, new SyllableConnector(connection, s));
    return connection.syllableConnectors[connection.syllableConnectors.length - 1];
  }

  connectionRemoveSyllableConnector(syllableConnector: SyllableConnector) {
    if (!syllableConnector) { return; }
    this.caller.pushChangedViewElement(syllableConnector.syllable, syllableConnector.connection.textRegion, syllableConnector.connection.musicRegion);
    this.removeFromArray(syllableConnector.connection.syllableConnectors, syllableConnector);
    if (syllableConnector.connection.syllableConnectors.length === 0) { this.annotationRemoveConnection(syllableConnector.connection); }
  }

  syllableConnectorGetOrCreateNeumeconnector(sc: SyllableConnector, n: Note, tl: PageLine) {
    const nc = sc.neumeConnectors.find(c => c.neume === n);
    if (nc) { return nc; }
    this.caller.pushChangedViewElement(n, sc.syllable);
    this.caller.pushChangedViewElement(sc.connection.textRegion);
    this.caller.pushChangedViewElement(sc.connection.musicRegion);
    this.pushToArray(sc.neumeConnectors, new NeumeConnector(sc, n, tl));
    return sc.neumeConnectors[sc.neumeConnectors.length - 1];
  }

  syllableConnectorRemoveConnector(sc: SyllableConnector, n: NeumeConnector) {
    if (!n) { return; }
    this.caller.pushChangedViewElement(n.neume, sc.syllable);
    this.caller.pushChangedViewElement(sc.connection.textRegion);
    this.caller.pushChangedViewElement(sc.connection.musicRegion);
    this.removeFromArray(sc.neumeConnectors, n);
    if (sc.neumeConnectors.length === 0) { this.connectionRemoveSyllableConnector(sc); }
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
    page.blocks.forEach(b => b.lines.forEach(l => l.sentence.words.filter(w => w.syllables.length > 0)
      .filter(w => w.syllables[0].prefix.length > 0)
      .forEach(w => this.caller.runCommand(new CommandChangeProperty(w.syllables[0], 'prefix', w.syllables[0].prefix, '')))
    ));
    let lastDropCapitalText = '';
    page.readingOrder.readingOrder.forEach(pl => {
      if (pl.block.type === BlockType.DropCapital) {
        lastDropCapitalText += pl.sentence.text;
      } else {
        if (pl.sentence.words.length > 0 && pl.sentence.words[0].syllables.length > 0) {
          const s = pl.sentence.words[0].syllables[0];
          this.caller.runCommand(new CommandChangeProperty(s, 'prefix', s.prefix, lastDropCapitalText));
        }
        lastDropCapitalText = '';
      }
    });
  }

  updateSyllablePrefixOfLine(pageLine: PageLine) {
    const readingOrder = pageLine.block.page.readingOrder.readingOrder;
    if (pageLine.blockType === BlockType.Lyrics) {
      if (pageLine.sentence.words.length === 0 || pageLine.sentence.words[0].syllables.length === 0) {
        return;
      }

      const s = pageLine.sentence.words[0].syllables[0];
      let newPrefix = '';
      let idx = readingOrder.indexOf(pageLine);
      if (idx < 0) {
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
        this.changeArray(l.sentence.words, l.sentence.words, []);
      }
    ));
  }

  changeLyrics(pageLine: PageLine, newSentence: Sentence) {
    const thisSentence = pageLine.sentence;
    if (thisSentence.words.length === 0) { thisSentence.words = newSentence.words; return; }

    this.startAction(ActionType.LyricsEdit, [pageLine]);

    let minWords = Math.min(thisSentence.words.length, newSentence.words.length);
    let startWords = 0;
    for (; startWords < minWords; startWords++) {
      if (!thisSentence.words[startWords].equals(newSentence.words[startWords])) {
        break;
      }
    }

    let endWords = 0;
    minWords -= startWords;
    for (; endWords < minWords; ++endWords) {
      if (!thisSentence.words[thisSentence.words.length - endWords - 1].equals(newSentence.words[newSentence.words.length - endWords - 1])) {
        break;
      }
    }

    const startWord = {this: thisSentence.words[startWords], new: newSentence.words[startWords]};
    const endWord = {this: thisSentence.words[thisSentence.words.length - endWords - 1], new: newSentence.words[newSentence.words.length - endWords - 1]};

    let startSyllables = -1;
    let endSyllables = -1;
    if (startWord.this && startWord.new) {
      const maxSyllables = Math.min(startWord.this.syllables.length, startWord.new.syllables.length);
      for (startSyllables = 0; startSyllables < maxSyllables; startSyllables++) {
        if (!startWord.this.syllables[startSyllables].equals(startWord.new.syllables[startSyllables])) {
          break;
        }
      }
    }
    if (endWord.this && endWord.new) {
      const maxSyllables = Math.min(endWord.this.syllables.length, endWord.new.syllables.length);
      for (endSyllables = 0; endSyllables < maxSyllables; endSyllables++) {
        if (!endWord.this.syllables[endWord.this.syllables.length - endSyllables - 1].equals(endWord.new.syllables[endWord.new.syllables.length - endSyllables - 1])) {
          break;
        }
      }
    }

    // remove all words between start and end
    const deletedSyllabes = new Array<Syllable>();
    if (startWord.new === endWord.new) {
      if (startWord.this === endWord.this && startWord.this) {
        const wordToChange = {this: startWord.this, new: startWord.new};
        const startSyllable = {this: wordToChange.this.syllables[startSyllables], new: wordToChange.new.syllables[startSyllables]};
        const endSyllable = {
          this: wordToChange.this.syllables[wordToChange.this.syllables.length - endSyllables - 1],
          new: wordToChange.new.syllables[wordToChange.new.syllables.length - endSyllables - 1],
        };


        while (startSyllables + endSyllables < Math.min(wordToChange.new.syllables.length, wordToChange.this.syllables.length)) {
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

        const deleted = wordToChange.this.syllables.splice(startSyllables, wordToChange.this.syllables.length - endSyllables - startSyllables, ...wordToChange.new.syllables.slice(startSyllables, wordToChange.new.syllables.length - endSyllables));
        deleted.forEach(s => deletedSyllabes.push(s));
      } else {
        // for simplicity: drop this words and insert start words
        const deleted = this.spliceArray(thisSentence.words, startWords, thisSentence.words.length - endWords - startWords, endWord.new);
        deleted.forEach(w => deletedSyllabes.push(...w.syllables));
      }
    } else {
      const deleted = this.spliceArray(thisSentence.words, startWords, thisSentence.words.length - endWords - startWords, ...newSentence.words.slice(startWords, newSentence.words.length - endWords));
      deleted.forEach(w => deletedSyllabes.push(...w.syllables));
    }

    const anno = pageLine.getBlock().page.annotations;
    deletedSyllabes.forEach(syllable => this.connectionRemoveSyllableConnector(anno.findSyllableConnector(pageLine, syllable)));

    this.updateSyllablePrefixOfLine(pageLine);
    this.finishAction();
  }

}
