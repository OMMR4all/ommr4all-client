import { Component, OnInit, HostListener } from '@angular/core';
import { StateMachinaService} from '../state-machina.service';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css']
})
export class ToolBarComponent implements OnInit {
  private machina;

  constructor(private stateMachinaService: StateMachinaService) { }

  ngOnInit() {
    this.machina = this.stateMachinaService.getMachina();
    this.machina.on('transition', this.handleStateChange.bind(this));
  }

  handleStateChange(data) {
    console.log(data);
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

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Digit1') {
      this.onToolStaffLines();
    } else if (event.code === 'Digit2') {
      this.onToolStaffGroup();
    } else if (event.code === 'Digit3') {
      this.onToolSymbols();
    }
  }
}
