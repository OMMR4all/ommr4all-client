import { Injectable, Component, OnInit, HostListener, } from '@angular/core';
const machina: any = require('machina');

@Injectable({
  providedIn: 'root'
})
export class StateMachinaService {
  states = new machina.Fsm({
    initialState: 'toolsStaffGroup',
    states: {
      toolsStaffLines: {
        toolsStaffGroup: 'toolsStaffGroup'
      },
      toolsStaffGroup: {
        toolsStaffLines: 'toolsStaffLines'
      }
    }
  });

  constructor() {
  }

  getMachina() {
    return this.states;
  }
}
