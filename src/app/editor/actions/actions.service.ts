import { Injectable } from '@angular/core';
import {EditorService} from '../editor.service';
import {CommandCreateMusicLine, CommandCreateMusicRegion, CommandCreateStaffLine} from '../undo/data-type-commands';
import {MusicRegion} from '../../data-types/page/music-region/music-region';
import {PolyLine} from '../../geometry/geometry';
import {MusicLine} from '../../data-types/page/music-region/music-line';

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

}
