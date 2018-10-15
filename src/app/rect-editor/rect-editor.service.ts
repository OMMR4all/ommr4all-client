import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RectEditorService {
  readonly _states = {data: null};  // hack to store reference

  get states() {
    return this._states.data;
  }

  get state() {
    if (!this.states) { return 'not initialized'; }
    return this.states.state;
  }

  set states(data) {
    this._states.data = data;
  }
}
