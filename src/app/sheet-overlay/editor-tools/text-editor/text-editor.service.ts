import {Injectable} from '@angular/core';
import {Rect} from '../../../geometry/geometry';
import {TextEquivContainer, TextEquivIndex} from '../../../data-types/page/definitions';
import {Region} from '../../../data-types/page/region';
import {TextRegion, TextRegionType} from '../../../data-types/page/text-region';


@Injectable({
  providedIn: 'root'
})
export class TextEditorService {
  private readonly _states = {data: null};  // hack to store reference
  public currentTextEquivContainer: TextEquivContainer;
  public get currentTextEquiv() {
    return this.currentTextEquivContainer ? this.currentTextEquivContainer.getOrCreateTextEquiv(TextEquivIndex.Syllables) : null;
  }
  public get currentAABB() {
    return this.currentTextEquivContainer ? this.currentTextEquivContainer.AABB : new Rect();
  }
  public  get mode() {
    if (!this.currentTextEquivContainer) { return; }
    const r = this.currentTextEquivContainer as any as Region;
    const p = r.parentOfType(TextRegion) as TextRegion;
    return p.type;
  }

  get states() {
    return this._states.data;
  }

  get state() {
    return this._states.data.state;
  }

  set states(data) {
    this._states.data = data;
  }

}
