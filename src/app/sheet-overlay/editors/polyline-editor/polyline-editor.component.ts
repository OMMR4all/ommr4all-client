import {Component, OnInit, Input, HostListener, ViewChild} from '@angular/core';
import { EditorTool } from '../../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {Point, PolyLine, Size, Rect} from '../../../geometry/geometry';
import {SelectionBoxComponent} from '../../../selection-box/selection-box.component';
import {PolylineEditorService} from './polyline-editor.service';
const machina: any = require('machina');

@Component({
  selector: '[app-polyline-editor]',
  templateUrl: './polyline-editor.component.html',
  styleUrls: ['./polyline-editor.component.css']
})
export class PolylineEditorComponent extends EditorTool implements OnInit {
  @ViewChild(SelectionBoxComponent) private selectionBox: SelectionBoxComponent;
  private prevMousePoint: Point = null;
  readonly mouseToSvg: (event: MouseEvent) => Point;
  readonly selectedPoints = new Set<Point>();
  readonly selectedPolyLines = new Set<PolyLine>();
  @Input() polyLines: Set<PolyLine>;

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
          _onEnter: () => {
            this.selectedPoints.clear();
            this.selectedPolyLines.clear();
          }
        },
        active: {
          selectPointHold: 'selectPointHold',
          selectionBox: 'selectionBox',
        },
        selectionBox: {
          canceled: 'idle',
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
      }
    });
  }

  ngOnInit() {
    this.polyLineEditorService.states = this.states;
    this.sheetOverlayService.mouseUp.subscribe(this.onMouseUp.bind(this));
    this.sheetOverlayService.mouseDown.subscribe(this.onMouseDown.bind(this));
    this.sheetOverlayService.mouseMove.subscribe(this.onMouseMove.bind(this));
  }

  onMouseDown(event: MouseEvent) {
    if (this.states.state === 'active' || this.states.state === 'idle') {
      if (event.shiftKey) {
        this.states.handle('selectionBox');
        this.selectionBox.initialMouseDown(event);
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }
  onMouseUp(event: MouseEvent) {
    if (this.states.state === 'movePoint') {
      this.states.handle('finished');
      event.preventDefault();
      event.stopPropagation();
    }
  }
  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    const d: Size = (this.prevMousePoint) ? p.measure(this.prevMousePoint) : new Size(0, 0);
    this.prevMousePoint = p;

    if (this.states.state === 'selectPointHold') {
      this.states.handle('move');
    } else if (this.states.state === 'movePoint') {
      this.selectedPoints.forEach(point => point.translateLocal(d));
      event.preventDefault();
      event.stopPropagation();
    }
  }
  onPolygonMouseDown(event: MouseEvent, polyline: PolyLine) {
    event.stopPropagation();
    event.preventDefault();
  }
  onPolygonMouseUp(event: MouseEvent, polyline: PolyLine) {
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

    }
  }
  onPolygonMouseMove(event: MouseEvent, polyline: PolyLine) {
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
        });
        this.selectedPolyLines.clear();
      } else {
        this.selectedPoints.forEach(p => {
          this.selectedPolyLines.forEach(line => {
            const idx = line.points.indexOf(p);
            if (idx >= 0) {
              line.points.splice(idx, 1);
            }
          });
        });
        this.selectedPoints.clear();
      }
    }
  }
}
