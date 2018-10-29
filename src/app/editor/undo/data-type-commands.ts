import {Command} from './commands';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {MusicLine} from '../../data-types/page/music-region/music-line';
import {PolyLine} from '../../geometry/geometry';
import {MusicRegion} from '../../data-types/page/music-region/music-region';
import {Page} from '../../data-types/page/page';
import {CommandChangeArray} from './util-commands';
import {copyList} from '../../utils/copy';

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
  private formerParent: MusicLine;
  constructor(
    private staffLine: StaffLine,
  ) {
    super();
    this.formerParent = staffLine.staff;
  }

  do() { this.staffLine.detachFromParent(); }
  undo() { this.staffLine.attachToParent(this.formerParent); }
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
