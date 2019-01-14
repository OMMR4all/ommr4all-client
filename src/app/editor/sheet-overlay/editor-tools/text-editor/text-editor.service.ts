import {Injectable} from '@angular/core';
import {Rect} from '../../../../geometry/geometry';
import {TextEquivIndex} from '../../../../data-types/page/definitions';
import {Region} from '../../../../data-types/page/region';
import {Line} from '../../../../data-types/page/line';


@Injectable({
  providedIn: 'root'
})
export class TextEditorService {
  private readonly _states = {data: null};  // hack to store reference
  public currentTextEquivContainer: Line = null;
  public get currentTextEquiv() {
    return this.currentTextEquivContainer ? this.currentTextEquivContainer.getOrCreateTextEquiv(TextEquivIndex.Syllables) : null;
  }
  public get currentAABB() {
    return this.currentTextEquivContainer ? this.currentTextEquivContainer.AABB : new Rect();
  }
  public get mode() {
    if (!this.currentTextEquivContainer) { return; }
    const p = this.currentTextEquivContainer.getBlock();
    return p.type;
  }

  get states() {
    return this._states.data;
  }

  get state() { if (!this.states) { return null; } return this.states.state; }

  set states(data) {
    this._states.data = data;
  }

}
