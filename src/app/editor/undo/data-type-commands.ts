import {Command} from './commands';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {PolyLine} from '../../geometry/geometry';
import {Page} from '../../data-types/page/page';
import {CommandChangeArray} from './util-commands';
import {copyFromList, copyList} from '../../utils/copy';
import {Symbol} from '../../data-types/page/music-region/symbol';
import {PageLine} from '../../data-types/page/pageLine';
import {Block} from '../../data-types/page/block';
import {BlockType} from '../../data-types/page/definitions';
import {Region} from '../../data-types/page/region';
import {Syllable} from '../../data-types/page/syllable';
import {ReadingOrder} from '../../data-types/page/reading-order';
import {arraysAreEqual} from 'tslint/lib/utils';
import {moveItemInArray} from '@angular/cdk/drag-drop';

export class CommandAttachSymbol extends Command {
  private readonly oldIdx: number;
  private readonly oldMusicLine: PageLine;
  constructor(
    private readonly symbol: Symbol,
    private readonly musicLine: PageLine,
  ) { super(); this.oldMusicLine = symbol.staff; if (this.oldMusicLine) { this.oldIdx = symbol.staff.symbols.indexOf(symbol); } }

  do() { this.symbol.attach(this.musicLine); }
  undo() { if (this.oldMusicLine) { this.oldMusicLine.addSymbol(this.symbol, this.oldIdx); } else { this.symbol.detach(); } }
  isIdentity() { return false; }
}

export class CommandDetachSymbol extends Command {
  private readonly musicLine: PageLine;
  private readonly idx: number;
  constructor(
    private readonly symbol: Symbol,
  ) { super(); this.musicLine = symbol.staff; this.idx = symbol.staff.symbols.indexOf(symbol); }
  do() { this.symbol.detach(); }
  undo() { this.musicLine.addSymbol(this.symbol, this.idx); }
  isIdentity() { return this.musicLine === null; }
}

export class CommandCreateBlock extends Command {
  public block: Block;
  private cmd: CommandChangeArray<Block>;

  constructor(
    private page: Page,
    private type: BlockType,
  ) {
    super();
    const prev = copyList(page.blocks);
    this.block = Block.create(page, type);
    this.cmd = new CommandChangeArray(page.blocks, prev, page.blocks);
  }

  do() { this.cmd.do(); }
  undo() { this.cmd.undo(); }
  isIdentity() { return this.cmd.isIdentity(); }
}

export class CommandAttachRegion extends Command {
  private readonly from: Region;
  constructor(
    private line: Region,
    private to: Region,
  ) {
    super();
    this.from = line.parent;
  }

  do() { this.line.attachToParent(this.to); }
  undo() { this.line.attachToParent(this.from); }
  isIdentity() { return this.from === this.to; }
}

export class CommandCreateLine extends Command {
  public line: PageLine;

  constructor(
    private block: Block,
  ) {
    super();
    this.line = block.createLine();
  }

  do() { this.line.attachToParent(this.block); }
  undo() { this.line.detachFromParent(); }
  isIdentity() { return false; }
}

export class CommandAttachLine extends Command {
  constructor(
    private line: PageLine,
    private from: Block,
    private to: Block,
  ) { super(); }

  do() { this.line.attachToParent(this.to); }
  undo() { this.line.attachToParent(this.from); }
  isIdentity() { return this.from === this.to; }
}

export class CommandCreateStaffLine extends Command {
  public readonly staffLine: StaffLine;
  constructor(
    private staff: PageLine,
    private polyLine: PolyLine,
  ) {
    super();
    this.staffLine = StaffLine.create(this.staff, this.polyLine);
  }

  do() { this.staffLine.attachToParent(this.staff); }
  undo() { this.staffLine.detachFromParent(); }
  isIdentity() { return false; }
}

export class CommandDeleteStaffLine extends Command {
  private readonly formerParent: PageLine;
  private readonly idx: number;
  constructor(
    private staffLine: StaffLine,
  ) {
    super();
    this.formerParent = staffLine.staff;
    this.idx = staffLine.staff.staffLines.indexOf(staffLine);
  }

  do() { this.staffLine.detachFromParent(); }
  undo() { this.staffLine.attachToParent(this.formerParent, this.idx); }
  isIdentity() { return false; }
}

export class CommandAttachStaffLine extends Command {
  constructor(
    private staffLine: StaffLine,
    private from: PageLine,
    private to: PageLine,
  ) { super(); }

  do() { this.staffLine.attachToParent(this.to); }
  undo() { this.staffLine.attachToParent(this.from); }
  isIdentity() { return this.from === this.to; }
}

export class CommandChangeSyllable extends Command {
  private from = new Syllable();
  constructor(
    private syllable: Syllable,
    private to: Syllable,
  ) {
    super();
    this.from.copyFrom(this.syllable);
  }

  do() { this.syllable.copyFrom(this.to); }
  undo() { this.syllable.copyFrom(this.from); }
  isIdentity(): boolean { return this.from.equals(this.to); }
}

export class CommandUpdateReadingOrder extends Command {
  private _fromReadingOrder: Array<PageLine>;
  private _toReadingOrder: Array<PageLine>;
  constructor(
    private readonly _readingOrder: ReadingOrder,
  ) {
    super();
    this._fromReadingOrder = copyList(_readingOrder.readingOrder);
    this._readingOrder._updateReadingOrder();
    this._toReadingOrder = copyList(_readingOrder.readingOrder);
  }

  do() { this._readingOrder.readingOrder = copyList(this._toReadingOrder); }
  undo() { this._readingOrder.readingOrder = copyList(this._fromReadingOrder); }
  isIdentity(): boolean { return arraysAreEqual(this._fromReadingOrder, this._toReadingOrder, (p1, p2) => p1 === p2); }
}

export class CommandMoveInReadingOrder extends Command {
  private readonly _from: Array<PageLine>;
  private readonly _to: Array<PageLine>;
  constructor(
    private readonly _readingOrder: ReadingOrder,
    private readonly fromIdx: number,
    private readonly toIdx: number,
  ) {
    super();
    this._from = copyList(_readingOrder.readingOrder);
    moveItemInArray(this._readingOrder.readingOrder, fromIdx, toIdx);
    this._to = copyList(_readingOrder.readingOrder);
  }

  do() {
    this._readingOrder.readingOrder = copyList(this._to);
    this._readingOrder._readingOrderChanged();
  }

  undo() {
    this._readingOrder.readingOrder = copyList(this._from);
    this._readingOrder._readingOrderChanged();
  }

  isIdentity(): boolean { return this.fromIdx === this.toIdx; }
}
