import {Component, OnInit, Output, EventEmitter, HostListener} from '@angular/core';
import { Rect, Point, Size } from '../../../../geometry/geometry';
import { SheetOverlayService } from '../../sheet-overlay.service';
import {Input} from '@angular/core';

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
        activate: 'active',
      },
      active: {
        _onEnter: () => {
          this.selectionRect = null;
          this.initialPoint = null;
          this.prevMousePoint = null;
        },
        idle: 'idle',
        drag: 'drag',
        cancel: 'idle',
      },
      drag: {
        idle: 'idle',
        finished: () => {
          this.selectionFinished.emit(this.selectionRect);
          this.states.transition('idle');
        },
        cancel: () => {
          this.selectionFinished.emit(new Rect());
          this.states.transition('idle');
        },
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
    this.sheetOverlayService.mouseUp.subscribe(this.onMouseUp.bind(this));
    this.sheetOverlayService.mouseDown.subscribe(this.onMouseDown.bind(this));
    this.sheetOverlayService.mouseMove.subscribe(this.onMouseMove.bind(this));
  }

  get states() {
    return this._states;
  }

  cancel() {
    this.states.handle('cancel');
  }

  initialMouseDown(event: MouseEvent) {
    this.states.handle('activate');
    this.onMouseDown(event);
  }

  private onMouseDown(event: MouseEvent): boolean {
    if (this.states.state === 'idle') { return false; }

    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'active') {
      this.selectionRect = new Rect(p.copy(), new Size(0, 0));
      this.initialPoint = p;
      this.states.handle('drag');
      return true;
    }
    return false;
  }

  private onMouseUp(event: MouseEvent) {
    if (this.states.state === 'idle') { return; }

    this.states.handle('finished');
  }

  private onMouseMove(event: MouseEvent) {
    if (this.states.state === 'idle') { return; }

    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'drag') {
      this.selectionRect = new Rect(this.initialPoint.copy(), p.measure(this.initialPoint));
    }

  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
    }
  }
}
