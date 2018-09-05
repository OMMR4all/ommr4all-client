import { Injectable, Component, OnInit, HostListener, } from '@angular/core';
import { SymbolType } from './musical-symbols/symbol';
const machina: any = require('machina');

@Injectable({
  providedIn: 'root'
})
export class StateMachinaService {
  states = new machina.Fsm({
    initialState: 'toolsStaffGroup',
    states: {
      toolsStaffLines: {
        toolsStaffGroup: 'toolsStaffGroup',
        toolsSymbols: 'toolsSymbols',
        toolsLyrics: 'toolsLyrics',
      },
      toolsStaffGroup: {
        toolsStaffLines: 'toolsStaffLines',
        toolsSymbols: 'toolsSymbols',
        toolsLyrics: 'toolsLyrics',
      },
      toolsSymbols: {
        toolsStaffGroup: 'toolsStaffGroup',
        toolsStaffLines: 'toolsStaffLines',
        toolsLyrics: 'toolsLyrics',
      },
      toolsLyrics: {
        toolsStaffLines: 'toolsStaffLines',
        toolsStaffGroup: 'toolsStaffGroup',
        toolsSymbols: 'toolsSymbols',
      }
    }
  });
  currentSymbol = SymbolType.Note;

  constructor() {
  }

  getMachina() {
    return this.states;
  }
}
