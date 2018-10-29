import { Injectable } from '@angular/core';
import {EditorService} from '../editor.service';
import {
  CommandAttachMusicLine,
  CommandAttachStaffLine,
  CommandCreateMusicLine,
  CommandCreateMusicRegion,
  CommandCreateStaffLine,
  CommandDeleteStaffLine
} from '../undo/data-type-commands';
import {MusicRegion} from '../../data-types/page/music-region/music-region';
import {Point, PolyLine} from '../../geometry/geometry';
import {MusicLine} from '../../data-types/page/music-region/music-line';
import {copyList} from '../../utils/copy';
import {CommandChangeArray, CommandChangeSet} from '../undo/util-commands';
import {EmptyMusicRegionDefinition} from '../../data-types/page/definitions';
import {Page} from '../../data-types/page/page';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {ActionCaller} from '../undo/commands';
import {CommandChangePoint, CommandChangePolyLine} from '../undo/geometry_commands';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  private readonly _actionCaller = new ActionCaller();

  constructor(
  ) { }

  private get caller() { return this._actionCaller; }

  redo() { this._actionCaller.redo(); }
  undo() { this._actionCaller.undo(); }
  reset() { this._actionCaller.reset(); }
  startAction(label: string) { this.caller.startAction(label); }
  finishAction() { this.caller.finishAction(); }

  // general
  changeSet<T>(v: Set<T>, from: Set<T>, to: Set<T>) { this.caller.runCommand(new CommandChangeSet(v, from, to)); }
  changeSet2<T>(v: Set<T>, initial: Set<T>) { this.caller.runCommand(new CommandChangeSet(v, initial, v)); }
  changeArray<T>(v: Array<T>, from: Array<T>, to: Array<T>) { this.caller.runCommand(new CommandChangeArray(v, from, to)); }
  changeArray2<T>(v: Array<T>, initial: Array<T>) { this.caller.runCommand(new CommandChangeArray(v, initial, v)); }

  // geometry
  changePoint(p: Point, from: Point, to: Point) { this.caller.runCommand(new CommandChangePoint(p, from, to)); }
  changePoint2(p: Point, init: Point) { this.caller.runCommand(new CommandChangePoint(p, init, p)); }
  changePolyLine(pl: PolyLine, from: PolyLine, to: PolyLine) { this.caller.runCommand(new CommandChangePolyLine(pl, from, to)); }
  changePolyLine2(pl: PolyLine, init: PolyLine) { this.caller.runCommand(new CommandChangePolyLine(pl, init, pl)); }

  addNewMusicRegion(page) {
    const cmd = new CommandCreateMusicRegion(page);
    this.caller.runCommand(cmd);
    return cmd.musicRegion;
  }

  addNewMusicLine(musicRegion: MusicRegion) {
    const cmd = new CommandCreateMusicLine(musicRegion);
    this.caller.runCommand(cmd);
    return cmd.musicLine;
  }

  attachMusicLine(musicRegion: MusicRegion, musicLine: MusicLine) {
    this.caller.runCommand(new CommandAttachMusicLine(musicLine, musicLine.musicRegion, musicRegion));
  }

  addNewStaffLine(musicLine: MusicLine, polyLine: PolyLine) {
    const cmd = new CommandCreateStaffLine(musicLine, polyLine);
    this.caller.runCommand(cmd);
    return cmd.staffLine;
  }

  deleteStaffLine(staffLine: StaffLine) {
    this.caller.runCommand(new CommandDeleteStaffLine(staffLine));
  }

  attachStaffLine(newMusicLine: MusicLine, staffLine: StaffLine) {
    this.caller.runCommand(new CommandAttachStaffLine(staffLine, staffLine.staff, newMusicLine));
  }

  cleanMusicLine(musicLine: MusicLine): void {
    const staffLinesBefore = copyList(musicLine.staffLines);
    musicLine.staffLines.filter(s => s.coords.points.length === 0).forEach(s => s.detachFromParent());
    this.caller.runCommand(new CommandChangeArray(musicLine.staffLines, staffLinesBefore, musicLine.staffLines));
  }

  cleanMusicRegion(musicRegion: MusicRegion, flags = EmptyMusicRegionDefinition.Default): void {
    const musicLinesBefore = copyList(musicRegion.musicLines);
    musicRegion.musicLines.forEach(s => this.cleanMusicLine(s));
    this.caller.runCommand(new CommandChangeArray(musicRegion.musicLines, musicLinesBefore,
      musicRegion.musicLines.filter(s => s.isNotEmpty(flags))));
  }

  cleanPageMusicRegions(page: Page, flags = EmptyMusicRegionDefinition.Default): void {
    const musicRegionsBefore = copyList(page.musicRegions);
    page.musicRegions.forEach(m => this.cleanMusicRegion(m, flags));
    this.caller.runCommand(new CommandChangeArray(page.musicRegions, musicRegionsBefore,
      page.musicRegions.filter(m => m.isNotEmpty(flags))));
  }

  cleanPage(page: Page): void {
    this.cleanPageMusicRegions(page);
    // TODO: undo/redo support
    page.cleanTextRegions();
  }

}
