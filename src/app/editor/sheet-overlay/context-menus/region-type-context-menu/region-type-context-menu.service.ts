import {EventEmitter, Injectable, Output} from '@angular/core';
import {BlockType} from '../../../../data-types/page/definitions';

export enum RegionTypesContextMenu {
  Music = BlockType.Music,
  Lyrics = BlockType.Lyrics,
  Text = BlockType.Paragraph,
  DropCapital = BlockType.DropCapital,

  Closed = 100,
  AddToContext,
  Delete,
}

@Injectable({
  providedIn: 'root'
})
export class RegionTypeContextMenuService {

  constructor() { }
}
