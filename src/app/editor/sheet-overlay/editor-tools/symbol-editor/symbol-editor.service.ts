import { Injectable } from '@angular/core';
import {LogicalConnection} from '../../../../data-types/page/music-region/music-line';

@Injectable({
  providedIn: 'root'
})
export class SymbolEditorService {
  readonly _states = {data: null};  // hack to store reference
  public selectedLogicalConnection: LogicalConnection;

  constructor() { }

  get states() {
    return this._states.data;
  }

  get state() { if (!this.states) { return null; } return this.states.state; }

  set states(data) {
    this._states.data = data;
  }
}
