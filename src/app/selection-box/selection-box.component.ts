import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import { Rect, Point, Size } from '../geometry/geometry';
import { SheetOverlayService } from '../sheet-overlay/sheet-overlay.service';

const machina: any = require('machina');

@Component({
  selector: '[app-selection-box]',
  templateUrl: './selection-box.component.html',
  styleUrls: ['./selection-box.component.css']
})
export class SelectionBoxComponent implements OnInit {
  @Output() selectionFinished = new EventEmitter<Rect>();
  @Output() selectionUpdated = new EventEmitter<Rect>();

  private prevMousePoint: Point;
  private mouseToSvg: (event: MouseEvent) => Point;
  private _selectionRect: Rect;
  initialPoint: Point;

  private _states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {
        _onEnter: () => {
          this.selectionRect = null;
          this.initialPoint = null;
          this.prevMousePoint = null;
        },
        drag: 'drag'
      },
      drag: {
        idle: 'idle'
      }
    }
  });

  constructor(private sheetOverlayService: SheetOverlayService) {
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
  }

  get selectionRect() {
    return this._selectionRect;
  }

  set selectionRect(rect: Rect) {
    if (this.selectionRect !== rect || (this.selectionRect && this.selectionRect.equals(rect) === false)) {
      this._selectionRect = rect;
      this.selectionUpdated.emit(this.selectionRect);
    }
  }

  ngOnInit() {
  }

  get states() {
    return this._states;
  }

  onMouseDown(event: MouseEvent): boolean {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'idle') {
      this.selectionRect = new Rect(p.copy(), new Size(0, 0));
      this.initialPoint = p;
      this.states.handle('drag');
      return true;
    }
    return false;
  }

  onMouseUp(event: MouseEvent) {
    if (this.states.state === 'drag') {
      this.selectionFinished.emit(this.selectionRect);
    }
    this.states.handle('idle');
  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'drag') {
      this.selectionRect = new Rect(this.initialPoint.copy(), p.measure(this.initialPoint));
    }

  }
}
