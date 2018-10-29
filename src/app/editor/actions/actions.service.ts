import { Injectable } from '@angular/core';
import {EditorService} from '../editor.service';
import {
  CommandAttachMusicLine,
  CommandAttachStaffLine,
  CommandCreateMusicLine,
  CommandCreateMusicRegion,
  CommandCreateStaffLine, CommandCreateTextLine, CommandCreateTextRegion,
  CommandDeleteStaffLine
} from '../undo/data-type-commands';
import {MusicRegion} from '../../data-types/page/music-region/music-region';
import {Point, PolyLine} from '../../geometry/geometry';
import {MusicLine} from '../../data-types/page/music-region/music-line';
import {copyList, copySet} from '../../utils/copy';
import {CommandChangeArray, CommandChangeSet} from '../undo/util-commands';
import {EmptyMusicRegionDefinition} from '../../data-types/page/definitions';
import {Page} from '../../data-types/page/page';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {ActionCaller} from '../undo/commands';
import {CommandChangePoint, CommandChangePolyLine} from '../undo/geometry_commands';
import {TextRegion, TextRegionType} from '../../data-types/page/text-region';

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
  addToSet<T>(v: Set<T>, newElement: T) { const n = copySet(v); n.add(newElement); this.changeSet(v, v, n); }
  removeFromSet<T>(v: Set<T>, del: T) { const n = copySet(v); n.delete(del); this.changeSet(v, v, n); }
  changeSet<T>(v: Set<T>, from: Set<T>, to: Set<T>) { this.caller.runCommand(new CommandChangeSet(v, from, to)); }
  changeSet2<T>(v: Set<T>, initial: Set<T>) { this.caller.runCommand(new CommandChangeSet(v, initial, v)); }

  removeFromArray<T>(v: Array<T>, del: T) { const idx = v.indexOf(del); if (idx >= 0) { const n = copyList(v); n.splice(idx, 1); this.changeArray(v, v, n); } }
  changeArray<T>(v: Array<T>, from: Array<T>, to: Array<T>) { this.caller.runCommand(new CommandChangeArray(v, from, to)); }
  changeArray2<T>(v: Array<T>, initial: Array<T>) { this.caller.runCommand(new CommandChangeArray(v, initial, v)); }

  // geometry
  changePoint(p: Point, from: Point, to: Point) { this.caller.runCommand(new CommandChangePoint(p, from, to)); }
  changePoint2(p: Point, init: Point) { this.caller.runCommand(new CommandChangePoint(p, init, p)); }
  changePolyLine(pl: PolyLine, from: PolyLine, to: PolyLine) { this.caller.runCommand(new CommandChangePolyLine(pl, from, to)); }
  changePolyLine2(pl: PolyLine, init: PolyLine) { this.caller.runCommand(new CommandChangePolyLine(pl, init, pl)); }

  // music regions

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

  // text regions

  addNewTextRegion(type: TextRegionType, page: Page): TextRegion {
    const cmd = new CommandCreateTextRegion(type, page);
    this.caller.runCommand(cmd);
    return cmd.textRegion;
  }

  addNewTextLine(textRegion: TextRegion) {
    const cmd = new CommandCreateTextLine(textRegion);
    this.caller.runCommand(cmd);
    return cmd.textLine;
  }

  // general page
  cleanPage(page: Page): void {
    this.cleanPageMusicRegions(page);
    // TODO: undo/redo support
    page.cleanTextRegions();
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

}
