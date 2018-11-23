import {EditorTools} from '../editor/tool-bar/tool-bar-state.service';
import {DefaultMap} from '../utils/data-structures';
import {enumMapToObj, objIntoEnumMap} from '../utils/converting';


export class PageEditingProgress {
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
    public locked = new DefaultMap<EditorTools, boolean>(false),
  ) {}
}
