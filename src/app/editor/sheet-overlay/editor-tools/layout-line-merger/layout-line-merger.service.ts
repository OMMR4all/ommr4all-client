import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutLineMergerService {
  readonly _states = {data: null};

  constructor() { }

  get states() {
    return this._states.data;
  }

  set states(data) {
    this._states.data = data;
  }

  get state() {
    if (!this.states) {
      return null;
    }
    return this.states.state;
  }
}
