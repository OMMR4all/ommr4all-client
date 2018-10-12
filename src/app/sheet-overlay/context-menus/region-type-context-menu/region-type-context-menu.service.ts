import {EventEmitter, Injectable, Output} from '@angular/core';

export enum RegionTypesContextMenu {
  Music,
  Lyrics,
  Text,
  DropCapital,
  Closed,
  AddToContext,
}

@Injectable({
  providedIn: 'root'
})
export class RegionTypeContextMenuService {

  constructor() { }
}
