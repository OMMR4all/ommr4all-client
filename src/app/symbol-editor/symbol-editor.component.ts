import { Component, OnInit } from '@angular/core';
import { SymbolEditorService } from './symbol-editor.service';

const machina: any = require('machina');

@Component({
  selector: 'app-symbol-editor',
  templateUrl: './symbol-editor.component.html',
  styleUrls: ['./symbol-editor.component.css']
})
export class SymbolEditorComponent implements OnInit {
  private states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {

      }
    }
  });

  constructor(private symbolEditorService: SymbolEditorService) {
    symbolEditorService.states = this.states;
  }

  ngOnInit() {
  }

}
