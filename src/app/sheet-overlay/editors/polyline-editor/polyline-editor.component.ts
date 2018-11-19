import {Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild} from '@angular/core';
import {EditorTool} from '../../editor-tools/editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {Point, PolyLine, Rect, Size} from '../../../geometry/geometry';
import {SelectionBoxComponent} from '../../../selection-box/selection-box.component';
import {PolylineEditorService} from './polyline-editor.service';
import {ActionsService} from '../../../editor/actions/actions.service';
import {ActionType} from '../../../editor/actions/action-types';
import {copyList, copySet} from '../../../utils/copy';

const machina: any = require('machina');

export class PolylineCreatedEvent {
  constructor(
    public polyLine: PolyLine,
    public siblings = new Set<PolyLine>(),
  ) {}
}

@Component({
  selector: '[app-polyline-editor]',  // tslint:disable-line component-selector
  templateUrl: './polyline-editor.component.html',
  styleUrls: ['./polyline-editor.component.css']
})
export class PolylineEditorComponent extends EditorTool implements OnInit {
  @ViewChild(SelectionBoxComponent) private selectionBox: SelectionBoxComponent;
  private prevMousePoint: Point = null;
  readonly mouseToSvg: (event: MouseEvent) => Point;
  readonly selectedPoints = new Set<Point>();
  readonly selectedPolyLines = new Set<PolyLine>();
  private movingPoints: Array<{p: Point, init: Point}> = [];
  private movingLines: Array<{l: PolyLine, init: PolyLine}> = [];
  public currentCreatedPolyLine: PolyLine;
  public currentCreatedPoint: Point;
  @Input() polyLines: Set<PolyLine>;
  @Input() baseAction: ActionType;
  @Output() polyLineDeleted = new EventEmitter<PolyLine>();
  @Output() polyLineCreated = new EventEmitter<PolylineCreatedEvent>();
  @Output() polyLineJoin = new EventEmitter<Set<PolyLine>>();

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    protected polyLineEditorService: PolylineEditorService,
    protected actions: ActionsService,
  ) {
    super(sheetOverlayService);
    this.mouseToSvg = this.sheetOverlayService.mouseToSvg.bind(this.sheetOverlayService);
    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          selectionBox: 'selectionBox',
          holdNew: 'newPointHold',
          areaBox: 'areaBox',
          create: 'create',
          append: 'appendPoint',
          _onEnter: () => {
            this.selectedPoints.clear();
            this.selectedPolyLines.clear();
          }
        },
        active: {
          selectPointHold: 'selectPointHold',
          holdNew: 'newPointHold',
          selectionBox: 'selectionBox',
          areaBox: 'areaBox',
          create: 'create',
          append: 'appendPoint',
          subtract: 'subtract',
          cancel: 'idle',
          delete: () => {
            this._startAction(ActionType.PolylineDelete);
            if (this.selectedPoints.size === 0) {
              // delete complete lines
              this.selectedPolyLines.forEach(line => {
                this.polyLineDeleted.emit(line);
              });
              this.selectedPolyLines.clear();
            } else {
              // delete points
              this.selectedPolyLines.forEach(line => {
                const lineBefore = line.copy();
                this.selectedPoints.forEach(point => {
                  const i = line.points.indexOf(point);
                  if (i >= 0) {
                    line.points.splice(i, 1);
                  }
                });
                this.actions.changePolyLine2(line, lineBefore);
                if (line.points.length <= 2) { this.polyLineDeleted.emit(line); }
              });
              this.selectedPoints.clear();
              this.selectedPolyLines.clear();
            }
            this.actions.finishAction();
          }
        },
        create: {
          _onEnter: () => {
            this.selectedPoints.clear();
            this.currentCreatedPolyLine = null;
            this.currentCreatedPoint = null;
          },
          _onExit: () => {
            this.currentCreatedPolyLine = null;
            this.currentCreatedPoint = null;
          },
          finished: () => {
            this.polyLineCreated.emit(new PolylineCreatedEvent(this.currentCreatedPolyLine, this.selectedPolyLines));
            this.states.transition('active');
          },
          cancel: () => {
            this.selectedPoints.clear();
            this.selectedPolyLines.clear();
            this.states.transition('idle');
          }
        },
        selectionBox: {
          canceled: 'idle',
          finished: 'active',
        },
        areaBox: {
          _onEnter: () => {
            this.selectedPoints.clear();
          },
          canceled: 'idle',
          finished: 'active',
        },
        subtract: {
          canceled: 'active',
          finished: 'active',
        },
        selectPointHold: {
          move: 'movePoint',
          idle: 'idle',
          edit: 'active',
          _onEnter: () => {
            this._startAction(ActionType.PolylineEdit);
          }
          // _onExit() only finishes Action if new state is not move point (see constructor)
        },
        newPointHold: {
          cancel: 'active',
          create: 'create',
        },
        movePoint: {
          finished: () => {
            this.movingPoints.forEach(pi => {
              this.actions.changePoint2(pi.p, pi.init);
            });
            this.movingPoints = [];
            this.movingLines.forEach(ml => {
              this.actions.changePolyLine2(ml.l, ml.init);
            });
            this.movingLines = [];
            this.states.transition('active');
          },
          cancel: 'active',
          _onEnter: () => {
            this.movingPoints = [];
            this.movingLines = [];
            this.selectedPoints.forEach(p => this.movingPoints.push({p: p, init: p.copy()}));
            this.selectedPolyLines.forEach(l => this.movingLines.push({l: l, init: l.copy()}));
          },
          _onExit: () => {
            // if moving points not used, handle as 'cancel', revert transformation!
            this.movingPoints.forEach(mp => mp.p.copyFrom(mp.init));
            this.movingPoints = [];
            this.movingLines.forEach(ml => ml.l.copyFrom(ml.init));
            this.movingLines = [];

            // finish the action
            this.actions.finishAction();
          },
        },
        appendPoint: {
          cancel: 'active',
          finished: 'active',
          _onEnter: () => {
            this.selectedPoints.clear();
            const p = this.prevMousePoint.copy();
            this.selectedPoints.add(p);
            this.selectedPolyLines.forEach(pl => { pl.points.splice(pl.closestLineInsertIndexToPoint(p), 0, p); });
          },
          _onExit: () => {
            this._deleteSelectedPoints();
          }

        },
      }
    });
  }

  ngOnInit() {
    this.polyLineEditorService.states = this.states;
    this.sheetOverlayService.mouseUp.subscribe(this.onMouseUp.bind(this));
    this.sheetOverlayService.mouseDown.subscribe(this.onMouseDown.bind(this));
    this.sheetOverlayService.mouseMove.subscribe(this.onMouseMove.bind(this));
    this.states.on('transition', (data: {fromState: string, toState: string}) => {
      if (data.fromState === 'selectPointHold' && data.toState !== 'movePoint') {
        this.actions.finishAction();
      }
    });
  }

  private get locked() { return this.sheetOverlayService.locked; }

  private _startAction(type: ActionType) {
    if (!type) { console.error('Type not set.'); }
    this.actions.startAction(type + this.baseAction);
  }

  private _deleteSelectedPoints(): void {
    this.selectedPoints.forEach(point => {
      this.selectedPolyLines.forEach(line => {
        const i = line.points.indexOf(point);
        if (i >= 0) {
          line.points.splice(i, 1);
        }
      });
    });
    this.selectedPoints.clear();
  }

  onMouseDown(event: MouseEvent) {
    if (this.locked || SheetOverlayService._isDragEvent(event)) { return; }
    if (this.states.state === 'active' || this.states.state === 'idle') {
      if (event.shiftKey) {
        this.states.handle('selectionBox');
        this.selectionBox.initialMouseDown(event);
      } else if (event.ctrlKey) {
        this.states.handle('areaBox');
        this.selectionBox.initialMouseDown(event);
      } else {
        this.states.handle('holdNew');
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }
  onMouseUp(event: MouseEvent) {
    if (this.locked || SheetOverlayService._isDragEvent(event)) { return; }

    const p = this.mouseToSvg(event);
    if (this.state === 'newPointHold') {
      if (!event.shiftKey) {
        this.states.handle('create');
        this.currentCreatedPolyLine = new PolyLine([p.copy(), p]);
        this.currentCreatedPoint = p;
      } else {
        this.states.handle('cancel');
      }
      event.preventDefault();
      event.stopPropagation();
    } else if (this.states.state === 'create') {
      this.currentCreatedPoint = p;
      this.currentCreatedPolyLine.points.push(p);
      this.currentCreatedPolyLine.fitPointToClosest(this.currentCreatedPoint);
      event.preventDefault();
      event.stopPropagation();
    } else if (this.state === 'appendPoint') {
      this._startAction(ActionType.PolylineInsert);
      const prevSelectedPoints = copySet(this.selectedPoints);
      this.selectedPoints.clear();
      this.selectedPoints.add(p);
      this.selectedPolyLines.forEach(pl => {
        // store action
        const newPoints = copyList(pl.points);
        pl.points = pl.points.filter(point => !prevSelectedPoints.has(point));
        this.actions.changePolyLine(pl, pl, new PolyLine(newPoints));

        // insert new point
        pl.points.splice(pl.closestLineInsertIndexToPoint(p), 0, p);
      });
      this.actions.finishAction();
      event.preventDefault();
      event.stopPropagation();
    } else if (this.states.state === 'movePoint') {
      this.states.handle('finished');
      event.preventDefault();
      event.stopPropagation();
    }
  }
  onMouseMove(event: MouseEvent) {
    if (this.locked || SheetOverlayService._isDragEvent(event)) { return; }

    const p = this.mouseToSvg(event);
    const d: Size = (this.prevMousePoint) ? p.measure(this.prevMousePoint) : new Size(0, 0);
    this.prevMousePoint = p;

    if (this.states.state === 'selectPointHold') {
      this.states.handle('move');
    } else if (this.states.state === 'movePoint') {
      this.selectedPoints.forEach(point => point.translateLocal(d));
      event.preventDefault();
      event.stopPropagation();
    } else if (this.states.state === 'create') {
      this.currentCreatedPoint.translateLocal(d);
      this.currentCreatedPolyLine.fitPointToClosest(this.currentCreatedPoint);
    } else if (this.state === 'appendPoint') {
      this.selectedPoints.forEach(point => point.translateLocal(d));
      this.selectedPoints.forEach(point => {
        this.selectedPolyLines.forEach(pl => {
          pl.fitPointToClosest(point);
        });
      });
      event.preventDefault();
      event.stopPropagation();
    }
  }
  onPolygonMouseDown(event: MouseEvent, polyline: PolyLine) {
    if (this.locked || SheetOverlayService._isDragEvent(event)) { return; }

    event.stopPropagation();
    event.preventDefault();
  }
  onPolygonMouseUp(event: MouseEvent, polyline: PolyLine) {
    if (this.locked || SheetOverlayService._isDragEvent(event)) { return; }

    if (this.states.state === 'idle' || this.states.state === 'active') {
      this._startAction(ActionType.PolylineSelect);
      if (event.shiftKey) {
        this.actions.addToSet(this.selectedPolyLines, polyline);
        event.stopPropagation();
        event.preventDefault();
      } else {
        this.actions.changeSet(this.selectedPolyLines, this.selectedPolyLines, new Set<PolyLine>([polyline]));
        event.stopPropagation();
        event.preventDefault();
      }
      this.actions.finishAction();
      this.states.handle('activate');
    } else if (this.state === 'subtract') {
      this.actions.startAction(ActionType.PolylineSubtract);
      this.selectedPolyLines.forEach(pl => {
        if (pl !== polyline) {
          if (event.shiftKey) {
            this.actions.changePolyLine(polyline, polyline, polyline.difference(pl));
          } else {
            this.actions.changePolyLine(pl, pl, pl.difference(polyline));
          }
        }
      });
      this.actions.finishAction();
      event.stopPropagation();
      event.preventDefault();
    }
  }
  onPolygonMouseMove(event: MouseEvent, polyline: PolyLine) {
    if (this.locked || SheetOverlayService._isDragEvent(event)) { return; }

    this.onMouseMove(event);
  }
  onPointMouseDown(event: MouseEvent, point: Point, line: PolyLine) {
    if (this.locked) { return; }
    if (this.states.state === 'idle' || this.states.state === 'active') {
      if (!event.shiftKey) {
        this.selectedPolyLines.clear();
        this.selectedPoints.clear();
      }
      this.selectedPoints.add(point);
      this.selectedPolyLines.add(line);
      this.states.handle('activate');
      this.states.handle('selectPointHold');
    } else if (this.states.state === 'create') {
      this.onMouseDown(event);
    }
    event.preventDefault();
    event.stopPropagation();
  }
  onPointMouseUp(event: MouseEvent, point: Point, line: PolyLine) {
    if (this.locked) { return; }
    if (this.states.state === 'selectPointHold') {
      this.states.handle('edit');
      this.selectedPoints.clear();
      this.selectedPoints.add(point);
      this.selectedPolyLines.add(line);
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.onMouseUp(event);
    }
  }
  onPointMouseMove(event: MouseEvent, point: Point) {
    if (this.locked) { return; }
    this.onMouseMove(event);
  }
  onSelectionFinished(rect: Rect) {
    if (this.locked) { return; }
    if (rect && rect.area > 0) {
      if (this.state === 'selectionBox') {
        this.actions.startAction(ActionType.PolylineSelect);
        const initPoints = copySet(this.selectedPoints);
        const initPolyLines = copySet(this.selectedPolyLines);
        this.selectedPoints.clear();
        this.selectedPolyLines.clear();
        this.polyLines.forEach((line) => {
          line.points.forEach(point => {
            if (rect.containsPoint(point)) {
              this.selectedPoints.add(point);
              this.selectedPolyLines.add(line);
            }
          });
        });
        this.actions.changeSet2(this.selectedPoints, initPoints);
        this.actions.changeSet2(this.selectedPolyLines, initPolyLines);
        this.actions.finishAction();
      } else if (this.state === 'areaBox') {
        const pl = this.sheetOverlayService.editorService.pcgts.page.polylineDifference(rect.toPolyline());
        this.polyLineCreated.emit(new PolylineCreatedEvent(pl, this.selectedPolyLines));
      }
      this.states.handle('finished');
    } else {
      this.states.handle('canceled');
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.locked) { return; }
    let preventDefault = true;
    if (event.code === 'Delete') {
      this.states.handle('delete');
    } else if (event.code === 'Enter') {
      if (this.state === 'create') {
        this.currentCreatedPolyLine.points.splice(this.currentCreatedPolyLine.points.indexOf(this.currentCreatedPoint), 1);
        this.states.handle('finished');
      }
    } else if (event.code === 'Escape') {
      this.states.handle('cancel');
    } else if (event.code === 'ControlLeft') {
      if (this.state === 'active' && this.selectedPolyLines.size === 1) {
        this.states.handle('append');
      }
    } else if (event.code === 'KeyJ') {
      if (this.state === 'active' && this.selectedPolyLines.size > 1) {
        this.polyLineJoin.emit(this.selectedPolyLines);
        this.selectedPolyLines.clear();
      }
    } else if (event.code === 'KeyS') {
      if (this.state === 'active' && this.selectedPolyLines.size > 0) {
        this.states.handle('subtract');
      }
    } else {
      preventDefault = false;
    }
    if (preventDefault) { event.preventDefault(); }
  }
  @HostListener('document:keyup', ['$event'])
  onKeyup(event: KeyboardEvent) {
    if (this.locked) { return; }
    if (event.code === 'KeyS') {
      if (this.state === 'subtract') {
        this.states.handle('finished');
      }
    } else if (event.code === 'ControlLeft') {
      if (this.states.state === 'appendPoint') {
        this.states.handle('finished');
      }
    }
  }
}
