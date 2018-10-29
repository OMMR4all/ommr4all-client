import { Injectable } from '@angular/core';
import {EditorService} from '../editor.service';
import {CommandCreateMusicLine, CommandCreateMusicRegion, CommandCreateStaffLine} from '../undo/data-type-commands';
import {MusicRegion} from '../../data-types/page/music-region/music-region';
import {PolyLine} from '../../geometry/geometry';
import {MusicLine} from '../../data-types/page/music-region/music-line';
import {copyList} from '../../utils/copy';
import {CommandChangeArray} from '../undo/util-commands';
import {EmptyMusicRegionDefinition} from '../../data-types/page/definitions';
import {Page} from '../../data-types/page/page';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {

  constructor(
    private editorService: EditorService,
  ) { }

  private get caller() { return this.editorService.actionCaller; }


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

  addNewStaffLine(musicLine: MusicLine, polyLine: PolyLine) {
    const cmd = new CommandCreateStaffLine(musicLine, polyLine);
    this.caller.runCommand(cmd);
    return cmd.staffLine;
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
