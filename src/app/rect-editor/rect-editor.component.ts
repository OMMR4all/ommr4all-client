import { Component, OnInit, HostListener } from '@angular/core';
import { Rect, Size, Point } from '../geometry/geometry';
import { SheetOverlayService } from '../sheet-overlay/sheet-overlay.service';
import { RectEditorService } from './rect-editor.service';
import { StateMachinaService } from '../state-machina.service';

const machina: any = require('machina');

@Component({
  selector: '[app-rect-editor]',
  templateUrl: './rect-editor.component.html',
  styleUrls: ['./rect-editor.component.css']
})
export class RectEditorComponent implements OnInit {
  states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {
        _onEnter: function() {
          this.selectedRect = null;
        }.bind(this),
        select: 'selected',
        drag: 'drag',
      },
      drag: {
        _onExit: function() {
          this.prevMousePoint = null;
          this.initialPoint = null;
        }.bind(this),
        cancel: 'idle',
        finished: 'selected',
      },
      selected: {
        deselect: 'idle',
      },
      dragNW: {
      },
      dragNE: {
      },
      dragSE: {
      },
      dragSW: {
      },
      dragN: {
      },
      dragE: {
      },
      dragS: {
      },
      dragW: {
      },
    }
  });

  selectedRect: Rect = null;
  private prevMousePoint = null;
  private initialPoint = null;

  get mouseToSvg() {
    return this.sheetOverlayService.mouseToSvg.bind(this.sheetOverlayService);
  }

  constructor(private sheetOverlayService: SheetOverlayService, private rectEditorService: RectEditorService,
              private stateMachinaService: StateMachinaService) {
    this.rectEditorService.states = this.states;
  }

  ngOnInit() {
    this.stateMachinaService.getMachina().on('transition', this.onMainMachinaTransition.bind(this));
  }

  onMainMachinaTransition(data) {
    this.states.transition('idle');
  }

  onMouseDown(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'idle') {
      this.selectedRect = new Rect(p.copy(), new Size(0, 0));
      this.initialPoint = p;
      this.states.handle('drag');
      return true;
    }
    return false;
  }

  onMouseUp(event: MouseEvent) {
    if (this.states.state === 'drag') {
      this.states.handle('finished');
    } else if (this.states.state.startsWith('drag')) {
      this.states.transition('selected');
    } else {
      this.states.handle('idle');
    }
  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'drag') {
      this.selectedRect = new Rect(this.initialPoint.copy(), p.measure(this.initialPoint));
    } else if (this.states.state === 'dragNW') {
      this.selectedRect.setN(p.y);
      this.selectedRect.setW(p.x);
    } else if (this.states.state === 'dragNE') {
      this.selectedRect.setN(p.y);
      this.selectedRect.setE(p.x);
    } else if (this.states.state === 'dragSW') {
      this.selectedRect.setS(p.y);
      this.selectedRect.setW(p.x);
    } else if (this.states.state === 'dragSE') {
      this.selectedRect.setS(p.y);
      this.selectedRect.setE(p.x);
    } else if (this.states.state === 'dragN') {
      this.selectedRect.setN(p.y);
    } else if (this.states.state === 'dragS') {
      this.selectedRect.setS(p.y);
    } else if (this.states.state === 'dragE') {
      this.selectedRect.setE(p.x);
    } else if (this.states.state === 'dragW') {
      this.selectedRect.setW(p.x);
    }

  }

  onDragNW(event: MouseEvent) {
    this.states.transition('dragNW');
  }
  onDragNE(event: MouseEvent) {
    this.states.transition('dragNE');
  }
  onDragSW(event: MouseEvent) {
    this.states.transition('dragSW');
  }
  onDragSE(event: MouseEvent) {
    this.states.transition('dragSE');
  }

  onDragN(event: MouseEvent) {
    this.states.transition('dragN');
  }
  onDragE(event: MouseEvent) {
    this.states.transition('dragE');
  }
  onDragS(event: MouseEvent) {
    this.states.transition('dragS');
  }
  onDragW(event: MouseEvent) {
    this.states.transition('dragW');
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.states.state === 'drag') {
        this.states.handle('cancel');
      } else if (this.states.state === 'selected') {
        this.states.handle('deselect');
      }
    }
  }
}
