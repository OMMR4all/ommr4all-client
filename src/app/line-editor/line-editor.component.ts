import {Component, OnInit, HostListener, ViewChild,} from '@angular/core';
import { PolyLine, Point, Size, Rect } from '../geometry/geometry';
import { ToolBarStateService } from '../tool-bar/tool-bar-state.service';
import { LineEditorService } from './line-editor.service';
import { SheetOverlayService } from '../sheet-overlay/sheet-overlay.service';
import { SelectionBoxComponent } from '../selection-box/selection-box.component';
import { StaffsService } from '../staffs.service';

const machina: any = require('machina');

@Component({
  selector: '[app-line-editor]',
  templateUrl: './line-editor.component.html',
  styleUrls: ['./line-editor.component.css', '../sheet-overlay/sheet-overlay.component.css']
})
export class LineEditorComponent implements OnInit {
  @ViewChild(SelectionBoxComponent) selectionBox: SelectionBoxComponent;
  private lineFinishedCallback: (line: PolyLine) => void;
  private lineDeletedCallback: (line: PolyLine) => void;
  private lineUpdatedCallback: (line: PolyLine) => void;
  private prevMousePoint: Point;
  currentPoints: Point[] = [];
  currentLines: PolyLine[] = [];
  newPoints: Point[] = [];
  private mouseToSvg: (event: MouseEvent) => Point;
  private states;

  constructor(private toolBarStateService: ToolBarStateService,
              private lineEditorService: LineEditorService,
              private sheetOverlayService: SheetOverlayService,
              private staffService: StaffsService) {
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
    this.lineEditorService.states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          createPath: 'createPath',
          edit: 'editPath',
          selectPath: 'selectPath',
          selectionBox: 'selectionBox',
          _onEnter: () => {
            this.currentLines = [];
            this.currentPoints = [];
          }
        },
        selectionBox: {
          idle: 'idle',
          edit: 'editPath',
        },
        createPath: {
          _onEnter: () => {
            this.currentLines = [];
            this.currentPoints = [];
          },
          _onExit: () => {
            for (const line of this.currentLines.filter((l: PolyLine) => l.points.length <= 1)) {
              this.lineFinishedCallback(line);
              this.lineUpdatedCallback(line);
            }
            if (this.currentLines.length === 0) {
              this.states.transition('idle');
            }
            this.newPoints = [];
          },
          edit: 'editPath',
          idle: 'idle',
          selectionBox: 'selectionBox',
        },
        editPath: {
          createPath: 'createPath',
          move: 'movePoint',
          idle: 'idle',
          append: 'appendPoint',
          selectPath: 'selectPath',
          selectionBox: 'selectionBox',
          _onExit: () => {
            this.currentLines.forEach((line) => {this.lineUpdatedCallback(line); });
          },
        },
        appendPoint: {
          _onEnter: () => {
            this._selectionToNewPoints(this.prevMousePoint);
          },
          _onExit: () => {
            this._deleteNewPoints();
          },
          edit: 'editPath',
          idle: 'idle',
        },
        movePoint: {
          edit: 'editPath',
          _onExit: () => {
            this.currentLines.forEach((line) => {this.lineUpdatedCallback(line); });
          },
        },
        selectPath: {
          finished: 'editPath',
          _onExit: () => {
            this.currentLines.forEach((line) => {this.lineUpdatedCallback(line); });
          }
        }
      }
    });
    this.states = this.lineEditorService.states;
  }

  setCallbacks(
    lineFinishedCallback: (line: PolyLine) => void,
    lineDeletedCallback: (line: PolyLine) => void,
    lineUpdatedCallback: (line: PolyLine) => void,
    ) {
    this.lineFinishedCallback = lineFinishedCallback;
    this.lineDeletedCallback = lineDeletedCallback;
    this.lineUpdatedCallback = lineUpdatedCallback;
  }

  ngOnInit() {
    this.toolBarStateService.editorToolChanged.subscribe((s) => { this.onToolChanged(s); });
    this.selectionBox.selectionFinished.subscribe((rect: Rect) => { this.onSelectionFinished(rect); });
  }

  private _selectionToNewPoints(center: Point = null): void {
    this.newPoints = [];
    if (this.currentPoints.length > 0) {
      const apCenter = new Point(0, 0);
      for (const line of this.currentLines) {
        for (const point of this.currentPoints) {
          if (line.points.indexOf(point) >= 0) {
            const p = point.copy();
            line.points.push(p);
            this.newPoints.push(p);
            apCenter.addLocal(p);
          }
        }
      }
      if (center && this.newPoints.length > 0) {
        apCenter.divideLocal(this.newPoints.length);
        for (const point of this.newPoints) {
          const d = point.measure(apCenter);
          point.copyFrom(center.translate(d));
        }

      }
    } else if (this.currentLines.length > 0) {
      for (const line of this.currentLines) {
        const p = center ? center : new Point(0, 0);
        line.points.push(p);
        this.newPoints.push(p);
      }
    } else {
      const line = new PolyLine([center ? center : new Point(0, 0), center ? center.copy() : new Point(0, 0)]);
      this.currentLines.push(line);
      this.newPoints = [line.points[0]];
      return;
    }

    this.currentLines.forEach((line) => line.points.sort((a, b) => a.x - b.x));
  }

  private _deleteNewPoints(): void {
    for (const point of this.newPoints) {
      for (const line of this.currentLines) {
        const i = line.points.indexOf(point);
        if (i >= 0) {
          line.points.splice(i, 1);
          break;
        }
      }
    }
    this.newPoints = [];
  }

  onSelectionFinished(rect: Rect): void {
    this.currentPoints = this.staffService.staffs.linePointsInRect(rect);
    this.currentLines = this.staffService.staffs.listLinesInRect(rect).map((staffLine) => staffLine.line);
    if (this.currentPoints.length > 0 || this.currentLines.length > 0) {
      this.states.handle('edit');
    } else {
      this.states.handle('idle');
    }
  }

  onToolChanged(s) {
    this.states.transition('idle');
  }

  onMouseDown(event: MouseEvent) {
    const p = this.mouseToSvg(event);

    if (this.states.state === 'idle') {
      if (event.ctrlKey) {
        this.states.handle('selectionBox');
        this.selectionBox.onMouseDown(event);
      } else {
        return false;
      }
    } else if (this.states.state === 'createPath') {
      if (event.ctrlKey) {
        this.states.handle('selectionBox');
        this.selectionBox.onMouseDown(event);
      } else {
        return false;
      }
    } else if (this.states.state === 'editPath') {
      if (event.ctrlKey) {
        this.states.handle('selectionBox');
        this.selectionBox.onMouseDown(event);
      } else {
        return false;
      }
    }
    event.stopPropagation();

    return true;
  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'editPath' || this.states.state === 'idle') {
      this.states.handle('createPath');
      this._selectionToNewPoints(p);
    } else if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      this._selectionToNewPoints(p);
    } else if (this.states.state === 'movePoint') {
      this.states.handle('edit');
    } else if (this.states.state === 'selectPath') {
      this.states.handle('finished');
    } else if (this.states.state === 'selectionBox') {
      this.selectionBox.onMouseUp(event);
    } else {
      return;
    }
  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    const d: Size = (this.prevMousePoint) ? p.measure(this.prevMousePoint) : new Size(0, 0);
    this.prevMousePoint = p;

    if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      for (const point of this.newPoints) {
        point.translateLocal(d);
      }
      for (const line of this.currentLines) {
        line.points.sort((a, b) => a.x - b.x);
      }
    } else if (this.states.state === 'movePoint') {
      for (const point of this.currentPoints) {
        point.translateLocal(d);
      }
      for (const line of this.currentLines) {
        line.points.sort((a, b) => a.x - b.x);
      }
    } else if (this.states.state === 'selectPath') {
      this.currentLines.forEach((line) => {line.translateLocal(d); });
    } else if (this.states.state === 'selectionBox') {
      this.selectionBox.onMouseMove(event);
    }
    event.stopPropagation();
  }

  onPointMouseDown(event: MouseEvent, point) {
    if (this.states.state === 'editPath') {
      if (event.ctrlKey) {
        if (this.currentPoints.indexOf(point) < 0) {
          this.currentPoints.push(point);
        }
      } else {
        this.currentPoints = [point];
      }
      this.states.handle('move');
      event.stopPropagation();
    } else if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      if (this.newPoints.indexOf(point) >= 0) {
        this.onMouseDown(event);
      }
    }
  }

  onLineMouseDown(event, line) {
    if (this.states.state === 'editPath') {
      this.currentLines = [line];
      this.currentPoints = [];
      this.states.handle('selectPath');
      event.stopPropagation();
    } else if (this.states.state === 'idle') {
      this.currentLines = [line];
      this.states.handle('selectPath');
      event.stopPropagation();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    console.log(event.code);
    if (this.states.state === 'createPath') {
      if (event.code === 'Escape' || event.code === 'Delete') {
        this.currentLines = [];
        this.states.handle('idle');
      } else if (event.code === 'Enter') {
        for (const point of this.newPoints) {
          for (const line of this.currentLines) {
            const i = line.points.indexOf(point);
            if (i >= 0) {
              line.points.splice(i, 1);
            }
          }
        }
        this.states.handle('edit');
      }
    } else if (this.states.state === 'editPath') {
      if (event.code === 'Escape') {
        this.states.handle('idle');
      } else if (event.code === 'Delete') {
        if (this.currentPoints.length > 0) {
          for (const currentPoint of this.currentPoints) {
            for (const line of this.currentLines) {
              const i = line.points.indexOf(currentPoint);
              if (i >= 0) {
                line.points.splice(i, 1);
                this.lineUpdatedCallback(line);
                break;
              }
            }
          }
          this.currentLines.filter((line) => line.points.length <= 1).forEach((line) => this.lineDeletedCallback(line));
          if (this.currentLines.length === 0) {
            this.states.handle('idle');
          }
          this.currentLines = [];
        } else {
          this.currentLines.forEach((line) => this.lineDeletedCallback(line));
          this.states.handle('idle');
        }
      } else if (event.code === 'ShiftLeft') {
        this.states.handle('append');
      }
    } else if (this.states.state === 'appendPoint') {

    }
  }
  @HostListener('document:keyup', ['$event'])
  onKeyup(event: KeyboardEvent) {
    if (this.states.state === 'appendPoint') {
      if (event.code === 'ShiftLeft') {
        this.states.handle('edit');
      }
    }
  }
}
