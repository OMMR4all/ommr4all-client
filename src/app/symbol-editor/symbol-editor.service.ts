import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SymbolEditorService {
  readonly _states = {data: null};  // hack to store reference

  constructor() { }

  get states() {
    return this._states.data;
  }

  get state() { if (!this.states) { return null; } return this.states.state; }

  set states(data) {
    this._states.data = data;
  }
}
