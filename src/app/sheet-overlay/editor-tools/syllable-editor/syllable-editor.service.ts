import { Injectable } from '@angular/core';
import {Syllable} from '../../../data-types/page/syllable';
import {Connection, NeumeConnector, SyllableConnector} from '../../../data-types/page/annotations';

@Injectable({
  providedIn: 'root'
})
export class SyllableEditorService {
  private readonly _states = {data: null};  // hack to store reference
  public currentSyllable: Syllable;
  public readonly selectedSyllableNeumeConnection: {
    c: Connection,
    s: SyllableConnector,
    n: NeumeConnector,
  } = {c: null, s: null, n: null};

  get states() {
    return this._states.data;
  }

  get state() { if (!this.states) { return null; } return this.states.state; }

  set states(data) {
    this._states.data = data;
  }
}
