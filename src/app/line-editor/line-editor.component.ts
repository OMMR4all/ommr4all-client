import { Component, OnInit, HostListener, } from '@angular/core';
import { PolyLine, Point } from '../geometry/geometry';
import { StateMachinaService } from '../state-machina.service';
import { LineEditorService } from './line-editor.service';
const machina: any = require('machina');

@Component({
  selector: '[app-line-editor]',
  templateUrl: './line-editor.component.html',
  styleUrls: ['./line-editor.component.css', '../sheet-overlay/sheet-overlay.component.css']
})
export class LineEditorComponent implements OnInit {
  private mainMachina;
  currentLine = new PolyLine([]);
  lineClass = 'staff-line';
  private lineFinishedCallback: (line: PolyLine) => void;
  private lineDeletedCallback: (line: PolyLine) => void;
  private lineUpdatedCallback: (line: PolyLine) => void;
  private prevMousePoint: Point;
  currentPoint: Point;
  private getSvgPoint: (x: number, y: number) => Point;
  private states;

  constructor(private stateMachinaService: StateMachinaService, private lineEditorService: LineEditorService) {
    this.lineEditorService.states = new machina.Fsm({
      initialize: function (options) {
      },
      initialState: 'idle',
      states: {
        idle: {
          createPath: 'createPath',
          edit: 'editPath',
          selectPath: 'selectPath',
          _onEnter: function() {
            this.currentLine = new PolyLine([]);
            this.currentPoint = null;
          }.bind(this)
        },
        createPath: {
          _onEnter: function() {
            this.currentLine = new PolyLine([]);
            this.currentPoint = null;
          }.bind(this),
          _onExit: function() {
            if (this.currentLine.points.length <= 1) {
              this.states.transition('idle');
              this.currentLine = new PolyLine([]);
            } else {
              this.lineFinishedCallback(this.currentLine);
              this.lineUpdatedCallback(this.currentLine);
            }
          }.bind(this),
          edit: 'editPath',
          idle: 'idle'
        },
        editPath: {
          createPath: 'createPath',
          move: 'movePoint',
          idle: 'idle',
          selectPath: 'selectPath',
          _onExit: function() {
            this.lineUpdatedCallback(this.currentLine);
          }.bind(this)
        },
        movePoint: {
          edit: 'editPath',
          _onExit: function() {
            this.lineUpdatedCallback(this.currentLine);
          }.bind(this)
        },
        selectPath: {
          finished: 'editPath',
          _onExit: function() {
            this.lineUpdatedCallback(this.currentLine);
          }.bind(this)
        }
      }
    });
    this.states = this.lineEditorService.states;
  }

  setCallbacks(
    svgPointCallback: (x: number, y: number) => Point,
    lineFinishedCallback: (line: PolyLine) => void,
    lineDeletedCallback: (line: PolyLine) => void,
    lineUpdatedCallback: (line: PolyLine) => void,
    ) {
    this.lineFinishedCallback = lineFinishedCallback;
    this.getSvgPoint = svgPointCallback;
    this.lineDeletedCallback = lineDeletedCallback;
    this.lineUpdatedCallback = lineUpdatedCallback;
  }

  ngOnInit() {
    this.mainMachina = this.stateMachinaService.getMachina();
    this.mainMachina.on('transition', this.onMainMachinaTransition.bind(this));
  }

  onMainMachinaTransition(data) {
    if (data.fromState === 'toolsStaffLines' && data.fromState !== data.toState) {
      this.states.transition('idle');
    }
  }

  onMouseDown(event: MouseEvent) {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);
    this.prevMousePoint = p;

    if (this.states.state === 'idle') {
      this.states.handle('createPath');

      this.currentLine.points.push(p);

      // add a second point that will be moved
      this.currentLine.points.push(new Point(p.x, p.y));
    } else if (this.states.state === 'createPath') {
      this.currentLine.points.push(p);
    } else if (this.states.state === 'editPath') {
      // not consumed
      return false;
    }

    return true;
  }

  onMouseUp(event: MouseEvent) {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);
    this.prevMousePoint = null;

    if (this.states.state === 'editPath') {
      this.states.handle('createPath');
      this.currentLine.points.push(p);
      this.currentLine.points.push(new Point(p.x, p.y));
    } else if (this.states.state === 'movePoint') {
      this.states.handle('edit');
    } else if (this.states.state === 'selectPath') {
      this.states.handle('finished');
    }
  }

  onMouseMove(event: MouseEvent) {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);
    const d = (this.prevMousePoint) ? p.subtract(this.prevMousePoint) : new Point(0, 0);
    this.prevMousePoint = p;

    if (this.states.state === 'createPath') {
      const lp = this.currentLine.points[this.currentLine.points.length - 1];
      lp.x = p.x;
      lp.y = p.y;
    } else if (this.states.state === 'movePoint') {
      this.currentPoint.x = p.x;
      this.currentPoint.y = p.y;
    } else if (this.states.state === 'selectPath') {
      this.currentLine.translate(d);
    }
  }

  onPointMouseUp(event, point) {
    this.onMouseUp(point);
  }

  onPointMouseDown(event, point) {
    if (this.states.state === 'editPath') {
      this.currentPoint = point;
      this.states.handle('move');
    } else if (this.states.state === 'createPath') {
      if (point === this.currentLine.points[this.currentLine.points.length - 1]) {
        this.onMouseDown(event);
      }
    }
  }

  onPointMove(event, point) {
    this.onMouseMove(event);
  }

  onLineMouseDown(event, line) {
    if (this.states.state === 'editPath') {
      this.currentLine = line;
      this.currentPoint = null;
      this.states.handle('selectPath');
    } else if (this.states.state === 'idle') {
      this.currentLine = line;
      this.states.handle('selectPath');
    }
  }

  onLineMouseUp(event, line) {
    this.onMouseUp(event);
  }

  onLineMouseMove(event, line) {
    this.onMouseMove(event);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
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
      }
    }
  }

}
