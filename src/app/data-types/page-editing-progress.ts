import {EditorTools} from '../editor/tool-bar/tool-bar-state.service';
import {DefaultMap, equalMaps} from '../utils/data-structures';
import {enumMapToObj, objIntoEnumMap} from '../utils/converting';
import {EventEmitter} from '@angular/core';


export class PageEditingProgress {
  readonly lockedChanged = new EventEmitter<{tool: EditorTools, value: boolean}>();

  static fromJson(json) {
    const pp = new PageEditingProgress();
    objIntoEnumMap(json.locked, pp.locked, EditorTools);
    return pp;
  }
  toJson() {
    return {
      'locked': enumMapToObj(this.locked, EditorTools)
    };
  }
  constructor(
    private locked = new DefaultMap<EditorTools, boolean>(false),
  ) {}

  getLocked(tool: EditorTools) { return this.locked.get(tool); }
  setLocked(tool: EditorTools, value: boolean) { this.locked.set(tool, value); this.lockedChanged.emit({tool: tool, value: value}); }
  toggleLocked(tool: EditorTools) { this.setLocked(tool, !this.locked.get(tool)); }


  equals(o: PageEditingProgress): boolean { return equalMaps(this, o); }
}
