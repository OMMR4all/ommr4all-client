import {Command} from './commands';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {PolyLine} from '../../geometry/geometry';
import {Page} from '../../data-types/page/page';
import {CommandChangeArray} from './util-commands';
import {copyList} from '../../utils/copy';
import {Symbol} from '../../data-types/page/music-region/symbol';
import {Line} from '../../data-types/page/line';
import {Block} from '../../data-types/page/block';
import {BlockType} from '../../data-types/page/definitions';
import {Region} from '../../data-types/page/region';

export class CommandAttachSymbol extends Command {
  private readonly oldIdx: number;
  private readonly oldMusicLine: Line;
  constructor(
    private readonly symbol: Symbol,
    private readonly musicLine: Line,
  ) { super(); this.oldMusicLine = symbol.staff; if (this.oldMusicLine) { this.oldIdx = symbol.staff.symbols.indexOf(symbol); } }

  do() { this.symbol.attach(this.musicLine); }
  undo() { if (this.oldMusicLine) { this.oldMusicLine.addSymbol(this.symbol, this.oldIdx); } else { this.symbol.detach(); } }
  isIdentity() { return false; }
}

export class CommandDetachSymbol extends Command {
  private readonly musicLine: Line;
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
    const prev = copyList(page.musicRegions);
    this.block = Block.create(page, type);
    this.cmd = new CommandChangeArray(page.musicRegions, prev, page.musicRegions);
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
  public line: Line;

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
    private line: Line,
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
    private staff: Line,
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
  private readonly formerParent: Line;
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
    private from: Line,
    private to: Line,
  ) { super(); }

  do() { this.staffLine.attachToParent(this.to); }
  undo() { this.staffLine.attachToParent(this.from); }
  isIdentity() { return this.from === this.to; }
}
