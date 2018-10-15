import {Injectable} from '@angular/core';
import {Rect} from '../../../geometry/geometry';
import {TextEquivContainer, TextEquivIndex} from '../../../data-types/page/definitions';

export enum TextEditorMode {
  Lyrics,
  Text,
  DropCapital,
}

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
  public mode = TextEditorMode.Lyrics;

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
