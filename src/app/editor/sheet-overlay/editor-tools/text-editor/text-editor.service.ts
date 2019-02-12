import {Injectable} from '@angular/core';
import {Rect} from '../../../../geometry/geometry';
import {TextEquivIndex} from '../../../../data-types/page/definitions';
import {Region} from '../../../../data-types/page/region';
import {PageLine} from '../../../../data-types/page/pageLine';


@Injectable({
  providedIn: 'root'
})
export class TextEditorService {
  private readonly _states = {data: null};  // hack to store reference

  get states() {
    return this._states.data;
  }

  get state() { if (!this.states) { return null; } return this.states.state; }

  set states(data) {
    this._states.data = data;
  }

}
