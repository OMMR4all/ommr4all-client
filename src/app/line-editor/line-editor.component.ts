import { Component, OnInit, HostListener, } from '@angular/core';
import { PolyLine, Point } from '../geometry/geometry';
import { ToolBarStateService } from '../tool-bar/tool-bar-state.service';
import { LineEditorService } from './line-editor.service';
import { SheetOverlayService } from '../sheet-overlay/sheet-overlay.service';
import {s} from '@angular/core/src/render3';
const machina: any = require('machina');

@Component({
  selector: '[app-line-editor]',
  templateUrl: './line-editor.component.html',
  styleUrls: ['./line-editor.component.css', '../sheet-overlay/sheet-overlay.component.css']
})
export class LineEditorComponent implements OnInit {
  currentLine = new PolyLine([]);
  lineClass = 'staff-line';
  private lineFinishedCallback: (line: PolyLine) => void;
  private lineDeletedCallback: (line: PolyLine) => void;
  private lineUpdatedCallback: (line: PolyLine) => void;
  private prevMousePoint: Point;
  currentPoint: Point;
  private mouseToSvg: (event: MouseEvent) => Point;
  private states;

  constructor(private toolBarStateService: ToolBarStateService,
              private lineEditorService: LineEditorService,
              private sheetOverlayService: SheetOverlayService) {
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
    this.lineEditorService.states = new machina.Fsm({
      initialize: function (options) {
      },
      initialState: 'idle',
      states: {
        idle: {
          createPath: 'createPath',
          edit: 'editPath',
          selectPath: 'selectPath',
          _onEnter: () => {
            this.currentLine = new PolyLine([]);
            this.currentPoint = null;
          }
        },
        createPath: {
          _onEnter: () => {
            this.currentLine = new PolyLine([]);
            this.currentPoint = null;
          },
          _onExit: () => {
            if (this.currentLine.points.length <= 1) {
              this.states.transition('idle');
              this.currentLine = new PolyLine([]);
            } else {
              this.lineFinishedCallback(this.currentLine);
              this.lineUpdatedCallback(this.currentLine);
            }
          },
          edit: 'editPath',
          idle: 'idle'
        },
        editPath: {
          createPath: 'createPath',
          move: 'movePoint',
          idle: 'idle',
          append: 'appendPoint',
          selectPath: 'selectPath',
          _onExit: () => {
            this.lineUpdatedCallback(this.currentLine);
          },
        },
        appendPoint: {
          _onEnter: () => {
            if (this.currentLine) {
              this.currentLine.points.push(new Point(this.prevMousePoint.x, this.prevMousePoint.y));
            }
          },
          _onExit: () => {
            if (this.currentLine) {
              this.currentLine.points.splice(this.currentLine.points.length - 1, 1);
            }
            this.lineUpdatedCallback(this.currentLine);
          },
          edit: 'editPath',
          idle: 'idle',
        },
        movePoint: {
          edit: 'editPath',
          _onExit: () => {
            this.lineUpdatedCallback(this.currentLine);
          },
        },
        selectPath: {
          finished: 'editPath',
          _onExit: () => {
            this.lineUpdatedCallback(this.currentLine);
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
    this.toolBarStateService.editorToolChanged.subscribe((s) => {this.onToolChanged(s);});
  }

  onToolChanged(s) {
    this.states.transition('idle');
  }

  onMouseDown(event: MouseEvent) {
    const p = this.mouseToSvg(event);

    if (this.states.state === 'idle') {
      return false;
    } else if (this.states.state === 'createPath') {
      return false;
    } else if (this.states.state === 'editPath') {
      return false;
    }
    event.stopPropagation();

    return true;
  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'editPath' || this.states.state === 'idle') {
      this.states.handle('createPath');
      this.currentLine.points.push(p);
      this.currentLine.points.push(new Point(p.x, p.y));
    } else if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      this.currentLine.points.push(p);
    } else if (this.states.state === 'movePoint') {
      this.states.handle('edit');
    } else if (this.states.state === 'selectPath') {
      this.states.handle('finished');
    } else {
      return;
    }
  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    const d = (this.prevMousePoint) ? p.subtract(this.prevMousePoint) : new Point(0, 0);
    this.prevMousePoint = p;

    if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      const lp = this.currentLine.points[this.currentLine.points.length - 1];
      lp.x = p.x;
      lp.y = p.y;
    } else if (this.states.state === 'movePoint') {
      this.currentPoint.x = p.x;
      this.currentPoint.y = p.y;
    } else if (this.states.state === 'selectPath') {
      this.currentLine.translate(d);
    }
    event.stopPropagation();
  }

  onPointMouseDown(event, point) {
    if (this.states.state === 'editPath') {
      this.currentPoint = point;
      this.states.handle('move');
      event.stopPropagation();
    } else if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      if (point === this.currentLine.points[this.currentLine.points.length - 1]) {
        this.onMouseDown(event);
      }
    }
  }

  onLineMouseDown(event, line) {
    if (this.states.state === 'editPath') {
      this.currentLine = line;
      this.currentPoint = null;
      this.states.handle('selectPath');
      event.stopPropagation();
    } else if (this.states.state === 'idle') {
      this.currentLine = line;
      this.states.handle('selectPath');
      event.stopPropagation();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    console.log(event.code);
    if (this.states.state === 'createPath') {
      if (event.code === 'Escape' || event.code === 'Delete') {
        this.currentLine = new PolyLine([]);
        this.states.handle('idle');
      } else if (event.code === 'Enter') {
        this.currentLine.points.pop();
        this.states.handle('edit');
      }
    } else if (this.states.state === 'editPath') {
      if (event.code === 'Escape') {
        this.states.handle('idle');
      } else if (event.code === 'Delete') {
        if (this.currentPoint) {
          this.currentLine.points.splice(this.currentLine.points.indexOf(this.currentPoint), 1);
          this.lineUpdatedCallback(this.currentLine);
          if (this.currentLine.points.length <= 1) {
            this.lineDeletedCallback(this.currentLine);
            this.states.handle('idle');
          }
        } else {
          this.lineDeletedCallback(this.currentLine);
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
