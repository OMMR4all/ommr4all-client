import { Component, OnInit, HostListener } from '@angular/core';
import { Rect, Size, Point } from '../../../../geometry/geometry';
import { SheetOverlayService } from '../../sheet-overlay.service';
import { RectEditorService } from './rect-editor.service';
import { ToolBarStateService } from '../../../tool-bar/tool-bar-state.service';

const machina: any = require('machina');

@Component({
  selector: '[app-rect-editor]',
  templateUrl: './rect-editor.component.html',
  styleUrls: ['./rect-editor.component.css']
})
export class RectEditorComponent implements OnInit {
  states: any;
  selectedRect: Rect = null;
  private prevMousePoint = null;
  private initialPoint = null;

  get mouseToSvg() {
    return this.sheetOverlayService.mouseToSvg.bind(this.sheetOverlayService);
  }

  constructor(private sheetOverlayService: SheetOverlayService, private rectEditorService: RectEditorService,
              private toolBarStateService: ToolBarStateService) {
    this.states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          _onEnter: () => {
            this.selectedRect = null;
          },
          select: 'selected',
          drag: 'drag',
        },
        drag: {
          _onExit: () => {
            this.prevMousePoint = null;
            this.initialPoint = null;
          },
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

    this.rectEditorService.states = this.states;
  }

  ngOnInit() {
    this.toolBarStateService.editorToolChanged.subscribe((v) => {this.onToolChanged(v);});
  }

  onToolChanged(data) {
    this.states.transition('idle');
  }

  onMouseDown(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    event.stopPropagation();

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
    event.stopPropagation();
  }
  onDragNE(event: MouseEvent) {
    this.states.transition('dragNE');
    event.stopPropagation();
  }
  onDragSW(event: MouseEvent) {
    this.states.transition('dragSW');
    event.stopPropagation();
  }
  onDragSE(event: MouseEvent) {
    this.states.transition('dragSE');
    event.stopPropagation();
  }

  onDragN(event: MouseEvent) {
    this.states.transition('dragN');
    event.stopPropagation();
  }
  onDragE(event: MouseEvent) {
    this.states.transition('dragE');
    event.stopPropagation();
  }
  onDragS(event: MouseEvent) {
    this.states.transition('dragS');
    event.stopPropagation();
  }
  onDragW(event: MouseEvent) {
    this.states.transition('dragW');
    event.stopPropagation();
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
