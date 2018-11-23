import {Command} from './commands';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {MusicLine} from '../../data-types/page/music-region/music-line';
import {PolyLine} from '../../geometry/geometry';
import {MusicRegion} from '../../data-types/page/music-region/music-region';
import {Page} from '../../data-types/page/page';
import {CommandChangeArray} from './util-commands';
import {copyList} from '../../utils/copy';
import {TextRegionComponent} from '../sheet-overlay/editor-tools/text-region/text-region.component';
import {TextRegion, TextRegionType} from '../../data-types/page/text-region';
import {TextLine} from '../../data-types/page/text-line';
import {Symbol} from '../../data-types/page/music-region/symbol';

export class CommandAttachSymbol extends Command {
  constructor(
    private symbol: Symbol,
    private musicLine: MusicLine,
  ) { super(); }

  do() { this.symbol.attach(this.musicLine); }
  undo() { this.symbol.detach(); }
  isIdentity() { return false; }
}

export class CommandDetachSymbol extends Command {
  private musicLine: MusicLine;
  private idx: number;
  constructor(
    private symbol: Symbol,
  ) { super(); this.musicLine = symbol.staff; this.idx = symbol.staff.symbols.indexOf(symbol); }
  do() { this.symbol.detach(); }
  undo() { this.musicLine.addSymbol(this.symbol, this.idx); }
  isIdentity() { return this.musicLine === null; }
}

export class CommandCreateMusicRegion extends Command {
  public musicRegion: MusicRegion;
  private cmd: CommandChangeArray<MusicRegion>;

  constructor(
    private page: Page,
  ) {
    super();
    const prev = copyList(page.musicRegions);
    this.musicRegion = page.addNewMusicRegion();
    this.cmd = new CommandChangeArray(page.musicRegions, prev, page.musicRegions);
  }

  do() { this.cmd.do(); }
  undo() { this.cmd.undo(); }
  isIdentity() { return this.cmd.isIdentity(); }
}

export class CommandCreateMusicLine extends Command {
  public musicLine: MusicLine;

  constructor(
    private musicRegion: MusicRegion,
  ) {
    super();
    this.musicLine = musicRegion.createMusicLine();
  }

  do() { this.musicLine.attachToParent(this.musicRegion); }
  undo() { this.musicLine.detachFromParent(); }
  isIdentity() { return false; }
}

export class CommandAttachMusicLine extends Command {
  constructor(
    private musicLine: MusicLine,
    private from: MusicRegion,
    private to: MusicRegion,
  ) { super(); }

  do() { this.musicLine.attachToParent(this.to); }
  undo() { this.musicLine.attachToParent(this.from); }
  isIdentity() { return this.from === this.to; }
}

export class CommandCreateStaffLine extends Command {
  public readonly staffLine: StaffLine;
  constructor(
    private staff: MusicLine,
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
  private readonly formerParent: MusicLine;
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
    private from: MusicLine,
    private to: MusicLine,
  ) { super(); }

  do() { this.staffLine.attachToParent(this.to); }
  undo() { this.staffLine.attachToParent(this.from); }
  isIdentity() { return this.from === this.to; }
}

export class CommandCreateTextRegion extends Command {
  public textRegion: TextRegion;
  private cmd: CommandChangeArray<TextRegion>;

  constructor(
    type: TextRegionType,
    private page: Page,
  ) {
    super();
    const prev = copyList(page.textRegions);
    this.textRegion = page.addTextRegion(type);
    this.cmd = new CommandChangeArray(page.textRegions, prev, page.textRegions);
  }

  do() { this.cmd.do(); }
  undo() { this.cmd.undo(); }
  isIdentity() { return this.cmd.isIdentity(); }
}

export class CommandCreateTextLine extends Command {
  public textLine: TextLine;

  constructor(
    private textRegion: TextRegion,
  ) {
    super();
    this.textLine = textRegion.createTextLine();
  }

  do() { this.textLine.attachToParent(this.textRegion); }
  undo() { this.textLine.detachFromParent(); }
  isIdentity() { return false; }
}
