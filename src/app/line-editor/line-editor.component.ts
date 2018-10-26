import {Component, EventEmitter, HostListener, OnInit, Output, ViewChild} from '@angular/core';
import {Point, PolyLine, Rect, Size} from '../geometry/geometry';
import {ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {LineEditorService} from './line-editor.service';
import {SheetOverlayService} from '../sheet-overlay/sheet-overlay.service';
import {SelectionBoxComponent} from '../selection-box/selection-box.component';
import {EditorService} from '../editor/editor.service';
import {EditorTool} from '../sheet-overlay/editor-tools/editor-tool';
import {CommandChangePoint, CommandChangePolyLine} from '../editor/undo/geometry_commands';
import {copySet, setFromList, mapOnSet} from '../utils/copy';
import {CommandChangeSet} from '../editor/undo/util-commands';
import {sortPolyLineByX} from '../editor/actions/action_factory';

const machina: any = require('machina');

@Component({
  selector: '[app-line-editor]',  // tslint:disable-line component-selector
  templateUrl: './line-editor.component.html',
  styleUrls: ['./line-editor.component.css', '../sheet-overlay/sheet-overlay.component.css']
})
export class LineEditorComponent extends EditorTool implements OnInit {
  @Output() newLineAdded = new EventEmitter<PolyLine>();
  @Output() lineUpdated = new EventEmitter<PolyLine>();
  @Output() lineDeleted = new EventEmitter<PolyLine>();

  @ViewChild(SelectionBoxComponent) private selectionBox: SelectionBoxComponent;
  private prevMousePoint: Point;
  private movingPoints: Array<{p: Point, init: Point}> = [];
  private movingLines: Array<{l: PolyLine, init: PolyLine}> = [];
  readonly currentPoints = new Set<Point>();
  readonly currentLines = new Set<PolyLine>();
  readonly newPoints = new Set<Point>();

  constructor(private toolBarStateService: ToolBarStateService,
              private lineEditorService: LineEditorService,
              protected sheetOverlayService: SheetOverlayService,
              private editorService: EditorService) {
    super(sheetOverlayService);
    this.mouseToSvg = sheetOverlayService.mouseToSvg.bind(sheetOverlayService);
    this.lineEditorService.states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          createPath: 'createPath',
          activate: 'active',
          selectPath: 'selectPath',
          selectionBox: 'selectionBox',
          _onEnter: () => {
            this.currentLines.clear();
            this.currentPoints.clear();
            this.movingLines = [];
            this.movingPoints = [];
            this.newPoints.clear();
          },
        },
        active: {
          createPath: 'createPath',
          hold: 'selectPointHold',
          idle: 'idle',
          append: () => { if (this.currentLines.size > 0) { this.states.transition('appendPoint'); } },
          selectPath: 'selectPath',
          selectionBox: 'selectionBox',
          _onExit: () => {
            this.currentLines.forEach((line) => {this.lineUpdated.emit(line); });
          },
          cancel: () => { this.states.handle('idle'); this.states.handle('activate'); },
        },
        selectionBox: {
          idle: 'idle',
          edit: 'active',
        },
        createPath: {
          _onEnter: () => {
            this.currentLines.clear();
            this.currentPoints.clear();
          },
          _onExit: () => {
            this.newPoints.clear();
          },
          finish: () => {
            this.editorService.actionCaller.startAction('New line');
            this.newPoints.forEach(point => {
              this.currentLines.forEach(line => {
                const i = line.points.indexOf(point);
                if (i >= 0) {
                  line.points.splice(i, 1);
                }
              });
            });
            this.currentLines.forEach(line => {
              this.newLineAdded.emit(line);
            });
            if (this.currentLines.size > 0) {
              this.states.transition('active');
            } else {
              this.states.transition('idle');
            }
            this.editorService.actionCaller.runCommand(new CommandChangeSet(
              this.currentLines, new Set<PolyLine>(), this.currentLines
            ));
            this.editorService.actionCaller.finishAction();
          },
          edit: 'active',
          idle: 'idle',
          cancel: 'idle',
          selectionBox: 'selectionBox',
        },
        selectPointHold: {
          move: 'movePoint',
          idle: 'idle',
          edit: 'active',
          _onEnter: () => {
            this.editorService.actionCaller.startAction('Edit points');
          }
          // _onExit() only finishes Action if new state is not move point (see constructor)
        },
        appendPoint: {
          _onEnter: () => {
            this._selectionToNewPoints(this.prevMousePoint);
          },
          _onExit: () => {
            this._deleteNewPoints();
          },
          cancel: 'active',
          edit: 'active',
          idle: 'idle',
        },
        movePoint: {
          edit: () => {
            this.movingPoints.forEach(pi => {
              this.editorService.actionCaller.runCommand(
                new CommandChangePoint(pi.p, pi.init, pi.p.copy())
              );
            });
            this.movingPoints = [];
            this.movingLines.forEach(ml => {
              this.editorService.actionCaller.runCommand(
                new CommandChangePolyLine(ml.l, ml.init, ml.l)
              );
            });
            this.movingLines = [];
            this.states.transition('active');
          },
          cancel: 'active',
          _onEnter: () => {
            this.movingPoints = [];
            this.movingLines = [];
            this.currentPoints.forEach(p => this.movingPoints.push({p: p, init: p.copy()}));
            this.currentLines.forEach(l => this.movingLines.push({l: l, init: l.copy()}));
          },
          _onExit: () => {
            // if moving points not used, handle as 'cancel', revert transformation!
            this.movingPoints.forEach(mp => mp.p.copyFrom(mp.init));
            this.movingPoints = [];
            this.movingLines.forEach(ml => ml.l.copyFrom(ml.init));
            this.movingLines = [];

            // finish the action
            this.editorService.actionCaller.finishAction();
            this.currentLines.forEach((line) => {this.lineUpdated.emit(line); });
          },
        },
        selectPath: {
          cancel: 'active',
          finished: 'active',
          move: 'movePath',
          _onEnter: () => { this.editorService.actionCaller.startAction('Edit path'); }
          // _onExit() only finishes Action if new state is not move point (see constructor)
        },
        movePath: {
          finished: () => {
            this.movingPoints.forEach(mp => {
              this.editorService.actionCaller.runCommand(
                new CommandChangePoint(mp.p, mp.init, mp.p.copy())
              );
            });
            this.movingPoints = [];
            this.movingLines.forEach(ml => {
              this.editorService.actionCaller.runCommand(
                new CommandChangePolyLine(ml.l, ml.init, ml.l)
              );
            });
            this.movingLines = [];
            this.states.transition('active');
          },
          cancel: 'active',
          _onEnter: () => {
            this.movingPoints = [];
            this.movingLines = [];
            this.currentLines.forEach(line => {
              this.movingLines.push({l: line, init: line.copy()});
              line.points.forEach(p => this.movingPoints.push({p: p, init: p.copy()}));
            });
          },
          _onExit: () => {
            // if moving points not used, handle as 'cancel', revert transformation!
            this.movingPoints.forEach(mp => mp.p.copyFrom(mp.init));
            this.movingPoints = [];
            this.movingLines.forEach(ml => ml.l.copyFrom(ml.init));
            this.movingLines = [];

            // finish the action
            this.editorService.actionCaller.finishAction();
            this.currentLines.forEach((line) => {this.lineUpdated.emit(line); });
          },
        }
      }
    });
    this._states = this.lineEditorService.states;
  }

  ngOnInit() {
    this.toolBarStateService.editorToolChanged.subscribe((s) => { this.onToolChanged(s); });
    this.states.on('transition', (data: {fromState: string, toState: string}) => {
      if (data.fromState === 'selectPointHold' && data.toState !== 'movePoint') {
        this.editorService.actionCaller.finishAction();
      } else if (data.fromState === 'selectPath' && data.toState !== 'movePath') {
        this.editorService.actionCaller.finishAction();
      }
    });
  }

  private _selectionToNewPoints(center: Point = null): void {
    const oldPoints = new Set<Point>(); this.newPoints.forEach(p => oldPoints.add(p));
    this.newPoints.clear();

    if (this.state === 'createPath') {
      // do not write actions on a new line, line is added as a whole to the actions if createPath finished
      if (this.currentLines.size === 0) {
        // add initial points
        const line = new PolyLine([center ? center : new Point(0, 0), center ? center.copy() : new Point(0, 0)]);
        this.currentLines.add(line);
        this.newPoints.add(line.points[0]);
      } else {
        if (this.currentLines.size !== 1) { console.warn('Only one line allowed in createPath'); }
        this.currentLines.forEach(line => {
          // add new point
          const point = center ? center : new Point(0, 0);
          line.points.push(point);
          this.newPoints.add(point);
        });
      }
    } else {
      // each change is a new action
      this.editorService.actionCaller.startAction('New points');
      if (this.currentPoints.size > 0) {
        const apCenter = new Point(0, 0);
        this.currentLines.forEach(line => {
          // current line state as 'to' and 'line - selected points' as from
          const newPoints = line.points.map(p => p);
          line.points = line.points.filter(p => !oldPoints.has(p));
          this.editorService.actionCaller.runCommand(
            new CommandChangePolyLine(line, line, new PolyLine(newPoints))
          );
          this.currentPoints.forEach(point => {
            if (line.points.indexOf(point) >= 0) {
              const p = point.copy();
              line.points.push(p);
              this.newPoints.add(p);
              apCenter.addLocal(p);
            }
          });
        });
        if (center && this.newPoints.size > 0) {
          apCenter.divideLocal(this.newPoints.size);
          this.newPoints.forEach(point => {
            const d = point.measure(apCenter);
            point.copyFrom(center.translate(d));
          });

        }
      } else if (this.currentLines.size > 0) {
        this.currentLines.forEach(line => {
          // current line state as 'to' and 'line - selected points' as from
          const newPoints = line.points.map(p => p);
          line.points = line.points.filter(p => !oldPoints.has(p));
          this.editorService.actionCaller.runCommand(
            new CommandChangePolyLine(line, line, new PolyLine(newPoints))
          );

          // add new point
          const point = center ? center : new Point(0, 0);
          line.points.push(point);
          this.newPoints.add(point);
        });
      } else {
        // TODO: do/undo should never occur
        console.log('Error this code should never be reaced, since it only serves for new lines (state=createPath)');
        const line = new PolyLine([center ? center : new Point(0, 0), center ? center.copy() : new Point(0, 0)]);
        this.currentLines.add(line);
        this.newPoints.add(line.points[0]);
        this.editorService.actionCaller.finishAction();
        return;
      }

      this._sortCurrentLines();
      this.editorService.actionCaller.finishAction();
    }
  }

  private _deleteNewPoints(): void {
    this.newPoints.forEach(point => {
      this.currentLines.forEach(line => {
        const i = line.points.indexOf(point);
        if (i >= 0) {
          line.points.splice(i, 1);
        }
      });
    });
    this.newPoints.clear();
  }

  private _sortCurrentLines(): void {
    this.currentLines.forEach(line => line.points.sort((a, b) => a.x - b.x));
  }

  private _setSet(set: Set<any>, list: Array<any>): void {
    set.clear();
    list.forEach(e => set.add(e));
  }

  onSelectionFinished(rect: Rect): void {
    this._setSet(this.currentPoints, this.editorService.pcgts.page.staffLinePointsInRect(rect));
    this._setSet(this.currentLines, this.editorService.pcgts.page.listLinesInRect(rect)
      .map((staffLine) => staffLine.coords));
    if (this.currentPoints.size > 0 || this.currentLines.size > 0) {
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
      if (event.shiftKey) {
        this.states.handle('selectionBox');
        this.selectionBox.initialMouseDown(event);
      }
    } else if (this.states.state === 'createPath') {
      if (event.shiftKey) {
        this.states.handle('selectionBox');
        this.selectionBox.initialMouseDown(event);
      }
    } else if (this.states.state === 'active') {
      if (event.shiftKey) {
        this.states.handle('selectionBox');
        this.selectionBox.initialMouseDown(event);
      }
    }
    event.stopPropagation();
    event.preventDefault();
  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'active') {
      this.states.handle('createPath');
      this._selectionToNewPoints(p);
    } else if (this.states.state === 'idle') {
      this.states.handle('createPath');
      this._selectionToNewPoints(p);
    } else if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      this._selectionToNewPoints(p);
    } else if (this.states.state === 'movePoint') {
      this.states.handle('edit');
    } else if (this.states.state === 'selectPath') {
      this.states.handle('finished');
    } else if (this.state === 'movePath') {
      this.states.handle('finished');
    } else if (this.states.state === 'selectionBox') {
    } else if (this.states.state === 'selectPointHold') {
      this.states.handle('edit');
    } else {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    const d: Size = (this.prevMousePoint) ? p.measure(this.prevMousePoint) : new Size(0, 0);
    this.prevMousePoint = p;

    if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      this.newPoints.forEach(point => point.translateLocal(d));
      this._sortCurrentLines();
    } else if (this.states.state === 'movePoint' || this.states.state === 'selectPointHold') {
      this.states.handle('move');
      this.currentPoints.forEach(point => point.translateLocal(d));
      this._sortCurrentLines();
    } else if (this.states.state === 'selectPath' || this.state === 'movePath') {
      this.states.handle('move');
      this.currentLines.forEach((line) => {line.translateLocal(d); });
    } else if (this.states.state === 'selectionBox') {
    }
    event.stopPropagation();
    event.preventDefault();
  }

  onPointMouseDown(event: MouseEvent, point) {
    if (this.states.state === 'active') {
      const prev = copySet(this.currentPoints);
      if (event.shiftKey) {
        this.currentPoints.add(point);
      } else {
        this._setSet(this.currentPoints, [point]);
      }
      this.states.handle('hold');
      this.editorService.actionCaller.runCommand(
        new CommandChangeSet(this.currentPoints, prev, this.currentPoints));
      event.stopPropagation();
      event.preventDefault();
    } else if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      if (this.newPoints.has(point)) {
        this.onMouseDown(event);
      }
    }
  }

  onPointMouseUp(event: MouseEvent, point) {
    event.stopPropagation();
    event.preventDefault();
    if (this.states.state === 'selectPointHold') {
      this._setSet(this.currentPoints, [point]);
      this.states.handle('edit');
    } else {
      this.onMouseUp(event);
    }
  }

  onLineMouseDown(event, line) {
    if (this.states.state === 'active') {
      this.states.handle('selectPath');
      this.editorService.actionCaller.runCommand(new CommandChangeSet(this.currentPoints, this.currentPoints, new Set<Point>()));
      this.editorService.actionCaller.runCommand(
        new CommandChangeSet(this.currentLines, copySet(this.currentLines), setFromList([line])));
      event.stopPropagation();
      event.preventDefault();
    } else if (this.states.state === 'idle') {
      this.states.handle('selectPath');
      this.editorService.actionCaller.runCommand(
        new CommandChangeSet(this.currentLines, copySet(this.currentLines), setFromList([line])));
      event.stopPropagation();
      event.preventDefault();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    console.log(event.code);
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    } else if (this.states.state === 'createPath') {
      if (event.code === 'Delete') {
        this.currentLines.clear();
        this.currentPoints.clear();
        this.newPoints.clear();
        this.states.handle('idle');
        event.preventDefault();
      } else if (event.code === 'Enter') {
        this.states.handle('finish');
        event.preventDefault();
      }
    } else if (this.states.state === 'active') {
      if (event.code === 'Escape') {
        this.states.handle('idle');
        event.preventDefault();
      } else if (event.code === 'Delete') {
        const oldCurrentLines = copySet(this.currentLines);
        this.editorService.actionCaller.startAction('Delete');
        if (this.currentPoints.size > 0) {
          this.currentLines.forEach(line => {
            this.editorService.actionCaller.runCommand(
              new CommandChangePolyLine(line, line, new PolyLine(
                line.points.filter(p => !this.currentPoints.has(p))
              ))
            );
            this.lineUpdated.emit(line);
          });
          this.currentLines.forEach(line => {
            if (line.points.length <= 1) {
              this.currentLines.delete(line);
              this.lineDeleted.emit(line);
            }
          });
          this.editorService.actionCaller.runCommand(new CommandChangeSet(this.currentLines, oldCurrentLines, new Set<PolyLine>()));
          this.editorService.actionCaller.runCommand(new CommandChangeSet(this.currentPoints, this.currentPoints, new Set<Point>()));
          if (this.currentLines.size === 0) {
            this.states.handle('idle');
          }
        } else {
          this.currentLines.forEach((line) => this.lineDeleted.emit(line));
          this.editorService.actionCaller.runCommand(new CommandChangeSet(this.currentLines, oldCurrentLines, new Set<PolyLine>()));
          this.editorService.actionCaller.runCommand(new CommandChangeSet(this.currentPoints, this.currentPoints, new Set<Point>()));
          this.states.handle('idle');
        }
        this.editorService.actionCaller.finishAction();
        event.preventDefault();
      } else if (event.code === 'ControlLeft') {
        this.states.handle('append');
        event.preventDefault();
      }
    } else if (this.states.state === 'appendPoint') {

    }
  }
  @HostListener('document:keyup', ['$event'])
  onKeyup(event: KeyboardEvent) {
    if (this.states.state === 'appendPoint') {
      if (event.code === 'ControlLeft') {
        this.states.handle('edit');
        event.preventDefault();
      }
    }
  }
}
