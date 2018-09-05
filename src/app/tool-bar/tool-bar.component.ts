import {Component, HostListener, OnInit} from '@angular/core';
import {StateMachinaService} from '../state-machina.service';
import {SymbolType} from '../musical-symbols/symbol';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css']
})
export class ToolBarComponent implements OnInit {
  machina;
  SymbolType = SymbolType;

  constructor(private stateMachinaService: StateMachinaService) { }

  ngOnInit() {
    this.machina = this.stateMachinaService.getMachina();
    this.machina.on('transition', this.handleStateChange.bind(this));
  }

  handleStateChange(data) {
  }

  get currentSymbol() {
    return this.stateMachinaService.currentSymbol;
  }

  set currentSymbol(s: SymbolType) {
    this.stateMachinaService.currentSymbol = s;
  }

  onToolStaffLines() {
    this.machina.handle('toolsStaffLines');
  }

  onToolStaffGroup() {
    this.machina.handle('toolsStaffGroup');
  }

  onToolSymbols() {
    this.machina.handle('toolsSymbols');
  }

  onToolLyrics() {
    this.machina.handle('toolsLyrics');
  }

  onToolsSymbolNote() {
    this.machina.transition('toolsSymbols');
    this.currentSymbol = SymbolType.Note;
  }

  onToolsSymbolCClef() {
    this.machina.transition('toolsSymbols');
    this.currentSymbol = SymbolType.C_Clef;
  }

  onToolsSymbolFClef() {
    this.machina.transition('toolsSymbols');
    this.currentSymbol = SymbolType.F_Clef;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Digit1') {
      this.onToolStaffLines();
    } else if (event.code === 'Digit2') {
      this.onToolStaffGroup();
    } else if (event.code === 'Digit3') {
      this.onToolSymbols();
    } else if (event.code === 'Digit4') {
      this.onToolLyrics();
    }
  }
}
