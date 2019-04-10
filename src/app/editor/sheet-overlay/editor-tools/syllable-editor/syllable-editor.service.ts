import { Injectable } from '@angular/core';
import {Syllable} from '../../../../data-types/page/syllable';

@Injectable({
  providedIn: 'root'
})
export class SyllableEditorService {
  private readonly _states = {data: null};  // hack to store reference
  public currentSyllable: Syllable;

  get states() {
    return this._states.data;
  }

  get state() { if (!this.states) { return null; } return this.states.state; }

  set states(data) {
    this._states.data = data;
  }
}
