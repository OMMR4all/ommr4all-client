import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PolylineEditorService {
  readonly _states = {data: null};  // hack to store reference

  get states() {
    return this._states.data;
  }

  set states(data) {
    this._states.data = data;
  }

  constructor() { }
}
