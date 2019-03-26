import {DefaultMap, equalMaps} from '../utils/data-structures';
import {enumMapToObj, objIntoEnumMap} from '../utils/converting';
import {EventEmitter} from '@angular/core';

export enum PageProgressGroups {
  StaffLines,
  Layout,
  Symbols,
  Text,
}

export class PageEditingProgress {
  readonly lockedChanged = new EventEmitter<{group: PageProgressGroups, value: boolean}>();

  static fromJson(json) {
    const pp = new PageEditingProgress();
    objIntoEnumMap(json.locked, pp.locked, PageProgressGroups);
    return pp;
  }
  toJson() {
    return {
      'locked': enumMapToObj(this.locked, PageProgressGroups)
    };
  }
  constructor(
    private locked = DefaultMap.create<PageProgressGroups, boolean>(false),
  ) {}

  getLocked(group: PageProgressGroups) { return this.locked.get(group); }
  setLocked(group: PageProgressGroups, value: boolean) { this.locked.set(group, value); this.lockedChanged.emit({group: group, value: value}); }
  toggleLocked(group: PageProgressGroups) { this.setLocked(group, !this.locked.get(group)); }


  equals(o: PageEditingProgress): boolean { return equalMaps(this, o); }
}
