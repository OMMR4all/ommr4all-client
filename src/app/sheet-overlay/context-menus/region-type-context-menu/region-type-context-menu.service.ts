import {EventEmitter, Injectable, Output} from '@angular/core';

export enum RegionTypesContextMenu {
  Music,
  Lyrics,
  Text,
}

@Injectable({
  providedIn: 'root'
})
export class RegionTypeContextMenuService {

  constructor() { }
}
