import {Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild} from '@angular/core';
import {EditorTool} from '../../editor-tools/editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {Point, PolyLine, Rect, Size} from '../../../geometry/geometry';
import {SelectionBoxComponent} from '../../../selection-box/selection-box.component';
import {PolylineEditorService} from './polyline-editor.service';
import {SheetOverlayComponent} from '../../sheet-overlay.component';
import {TextRegionType} from '../../../data-types/page/text-region';

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
  public currentCreatedPolyLine: PolyLine;
  public currentCreatedPoint: Point;
  @Input() polyLines: Set<PolyLine>;
  @Output() polyLineDeleted = new EventEmitter<PolyLine>();
  @Output() polyLineCreated = new EventEmitter<PolylineCreatedEvent>();
  @Output() polyLineJoin = new EventEmitter<Set<PolyLine>>();

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    protected polyLineEditorService: PolylineEditorService
  ) {
    super(sheetOverlayService);
    this.mouseToSvg = this.sheetOverlayService.mouseToSvg.bind(this.sheetOverlayService);
    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          selectionBox: 'selectionBox',
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
          selectionBox: 'selectionBox',
          areaBox: 'areaBox',
          create: 'create',
          append: 'appendPoint',
          subtract: 'subtract',
          cancel: 'idle',
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
          cancel: 'idle',
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
        },
        movePoint: {
          finished: 'active',
        },
        appendPoint: {
          cancel: 'active',
          finished: 'active',
          _onEnter: () => {
            this.selectedPoints.clear();
            this.selectedPolyLines.forEach(pl => {
              const p = this.prevMousePoint.copy();
              pl.points.push(p);
              this.selectedPoints.add(p);
            });
            this.selectedPoints.forEach(point => {
              this.selectedPolyLines.forEach(pl => {
                const idx = pl.points.indexOf(point);
                if (idx >= 0) {
                  const copy = new PolyLine(pl.points.filter(p => p !== point));
                  copy.points.splice(copy.closestLineInsertIndexToPoint(point), 0, point);
                  pl.points = copy.points;
                }
              });
            });
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
    if (SheetOverlayComponent._isDragEvent(event)) { return; }
    if (this.states.state === 'active' || this.states.state === 'idle') {
      if (event.shiftKey) {
        this.states.handle('selectionBox');
        this.selectionBox.initialMouseDown(event);
      } else if (event.ctrlKey) {
        this.states.handle('areaBox');
        this.selectionBox.initialMouseDown(event);
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }
  onMouseUp(event: MouseEvent) {
    if (SheetOverlayComponent._isDragEvent(event)) { return; }

    const p = this.mouseToSvg(event);
    if (this.states.state === 'active' || this.states.state === 'idle') {
      if (!event.shiftKey) {
        this.states.handle('create');
        this.currentCreatedPolyLine = new PolyLine([p.copy(), p]);
        this.currentCreatedPoint = p;
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
      this.selectedPoints.clear();
      this.selectedPoints.add(p);
      this.selectedPolyLines.forEach(pl => pl.points.push(p));
      this.selectedPoints.forEach(point => {
        this.selectedPolyLines.forEach(pl => {
          pl.fitPointToClosest(point);
        });
      });
      event.preventDefault();
      event.stopPropagation();
    } else if (this.states.state === 'movePoint') {
      this.states.handle('finished');
      event.preventDefault();
      event.stopPropagation();
    }
  }
  onMouseMove(event: MouseEvent) {
    if (SheetOverlayComponent._isDragEvent(event)) { return; }

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
    if (SheetOverlayComponent._isDragEvent(event)) { return; }

    event.stopPropagation();
    event.preventDefault();
  }
  onPolygonMouseUp(event: MouseEvent, polyline: PolyLine) {
    if (SheetOverlayComponent._isDragEvent(event)) { return; }

    if (this.states.state === 'idle' || this.states.state === 'active') {
      if (event.shiftKey) {
        this.selectedPolyLines.add(polyline);
        event.stopPropagation();
        event.preventDefault();
      } else {
        this.selectedPolyLines.clear();
        this.selectedPolyLines.add(polyline);
        event.stopPropagation();
        event.preventDefault();
      }
      this.states.handle('activate');
    } else if (this.state === 'subtract') {
      this.selectedPolyLines.forEach(pl => {
        if (pl !== polyline) {
          if (event.shiftKey) {
            polyline.moveRef(polyline.difference(pl));
          } else {
            pl.moveRef(pl.difference(polyline));
          }
        }
      });
      event.stopPropagation();
      event.preventDefault();
    }
  }
  onPolygonMouseMove(event: MouseEvent, polyline: PolyLine) {
    if (SheetOverlayComponent._isDragEvent(event)) { return; }

    this.onMouseMove(event);
  }
  onPointMouseDown(event: MouseEvent, point: Point, line: PolyLine) {
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
    this.onMouseMove(event);
  }
  onSelectionFinished(rect: Rect) {
    if (rect && rect.area > 0) {
      if (this.state === 'selectionBox') {
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
    if (event.code === 'Delete') {
      if (this.selectedPoints.size === 0) {
        this.selectedPolyLines.forEach(line => {
          this.polyLines.delete(line);
          this.polyLineDeleted.emit(line);
        });
        this.selectedPolyLines.clear();
      } else {
        this._deleteSelectedPoints();
        this.selectedPolyLines.forEach(line => {
          if (line.points.length === 0) { this.polyLineDeleted.emit(line); }
        });
      }
    } else if (event.code === 'Enter') {
      if (this.state === 'create') {
        this.currentCreatedPolyLine.points.splice(this.currentCreatedPolyLine.points.indexOf(this.currentCreatedPoint), 1);
        this.states.handle('finished');
      }
    } else if (event.code === 'Escape') {
      if (this.state === 'create') {
        this.selectedPoints.clear();
        this.selectedPolyLines.clear();
      } else if (this.state === 'appendPoint') {
        this.selectedPoints.clear();
        this.selectedPolyLines.forEach(pl =>
          pl.points.forEach(p => this.selectedPoints.add(p))
        );
      }
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
    }
  }
  @HostListener('document:keyup', ['$event'])
  onKeyup(event: KeyboardEvent) {
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
