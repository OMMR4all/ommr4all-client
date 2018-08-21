import { Component, OnInit, HostListener, } from '@angular/core';
import { Line, Point } from '../geometry/geometry';
import * as machina from 'machina';

@Component({
  selector: '[app-line-editor]',
  templateUrl: './line-editor.component.html',
  styleUrls: ['./line-editor.component.css', '../sheet-overlay/sheet-overlay.component.css']
})
export class LineEditorComponent implements OnInit {
  currentLine = new Line([]);
  lineClass = 'staff-line';
  private lineFinishedCallback: (line: Line) => void;
  currentPoint: Point;
  private mousePressed = false;
  private getSvgPoint: (x: number, y: number) => Point;

  states = new machina.Fsm({
    initialize: function (options) {
    },
    initialState: 'idle',
    states: {
      idle: {
        createPath: 'createPath',
        edit: 'editPath',
        _onEnter: function() {
          this.currentLine = new Line([]);
        }.bind(this)
      },
      createPath: {
        _onEnter: function() {
          this.currentLine = new Line([]);
        }.bind(this),
        _onExit: function() {
          if (this.currentLine.points.length <= 1) {
            this.states.transition('idle');
            this.currentLine = new Line([]);
          } else {
            this.lineFinishedCallback(this.currentLine);
          }
        }.bind(this),
        edit: 'editPath',
        idle: 'idle'
      },
      editPath: {
        createPath: function() {
          this.transition('createPath');
        },
        move: 'movePoint',
        idle: 'idle'
      },
      movePoint: {
        edit: 'editPath'
      }
    }
  });

  constructor() {
  }

  setLineFinishedCallback(lineFinishedCallback: (line: Line) => void) {
    this.lineFinishedCallback = lineFinishedCallback;
  }

  setGetSvgPoint(svgPoint: (x: number, y: number) => Point) {
    this.getSvgPoint = svgPoint;
  }

  ngOnInit() {
  }


  onMouseDown(event: MouseEvent) {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);

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

    if (this.states.state === 'editPath') {
      this.states.handle('createPath');
      this.currentLine.points.push(p);
      this.currentLine.points.push(new Point(p.x, p.y));
    } else if (this.states.state === 'movePoint') {
      this.states.handle('edit');
    }
  }

  onMouseMove(event: MouseEvent) {
    const p = this.getSvgPoint(event.offsetX, event.offsetY);

    if (this.states.state === 'createPath') {
      const lp = this.currentLine.points[this.currentLine.points.length - 1];
      lp.x = p.x;
      lp.y = p.y;
    } else if (this.states.state === 'movePoint') {
      this.currentPoint.x = p.x;
      this.currentPoint.y = p.y;
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
    } else if (this.states.state === 'idle') {
      this.currentLine = line;
      this.states.handle('edit');
    }
  }

  onLineMove(event) {
    this.onMouseMove(event);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.states.state === 'createPath') {
      if (event.code === 'Escape') {
        this.currentLine = new Line([]);
        this.states.handle('idle');
      } else if (event.code === 'Enter') {
        this.currentLine.points.pop();
        this.states.handle('edit');
      }
    } else if (this.states.state === 'editPath') {
      if (event.code === 'Escape') {
        this.states.handle('idle');
      }
    }
  }

}
