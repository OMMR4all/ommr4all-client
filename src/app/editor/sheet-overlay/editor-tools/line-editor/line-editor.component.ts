import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  EventEmitter,
  Input, OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Point, PolyLine, Rect, Size} from '../../../../geometry/geometry';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {LineEditorService} from './line-editor.service';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {SelectionBoxComponent} from '../../editors/selection-box/selection-box.component';
import {EditorService} from '../../../editor.service';
import {EditorTool} from '../editor-tool';
import {arrayFromSet, copySet, identicalSets, setFromList} from '../../../../utils/copy';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {StaffLine} from '../../../../data-types/page/music-region/staff-line';
import {PolylineComponent} from '../../elements/polyline/polyline.component';
import {PageLine} from '../../../../data-types/page/pageLine';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';

const machina: any = require('machina');

@Component({
  selector: '[app-line-editor]',  // tslint:disable-line component-selector
  templateUrl: './line-editor.component.html',
  styleUrls: ['./line-editor.component.css', '../../sheet-overlay.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly currentStaffLines = new Set<StaffLine>();
  get currentStaffLine(): StaffLine { return (this.currentStaffLines.size === 1) ? this.currentStaffLines.values().next().value : null; }
  get selectedCommentHolder() { return this.currentStaffLine; }
  readonly newPoints = new Set<Point>();

  constructor(private toolBarStateService: ToolBarStateService,
              private lineEditorService: LineEditorService,
              protected sheetOverlayService: SheetOverlayService,
              private actions: ActionsService,
              private editorService: EditorService,
              private changeDetector: ChangeDetectorRef,
              protected viewChanges: ViewChangesService,
  ) {
    super(sheetOverlayService, viewChanges,
      new ViewSettings(true, false, false, false, true),
    );
    this.changeDetector = changeDetector;
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
            this.currentStaffLines.clear();
            this.movingLines = [];
            this.movingPoints = [];
            this.newPoints.clear();
          },
        },
        active: {
          hold: 'selectPointHold',
          holdNew: 'newPointHold',
          idle: 'idle',
          append: () => { if (this.currentLines.size > 0) { this.states.transition('appendPoint'); } },
          selectPath: 'selectPath',
          selectionBox: 'selectionBox',
          _onExit: () => {
          },
          cancel: () => { this.states.handle('idle'); this.states.handle('activate'); },
        },
        newPointHold: {
          cancel: 'active',
          createPath: 'createPath',
        },
        selectionBox: {
          edit: 'active',
          cancel: () => {
            this.selectionBox.cancel();
            this.states.transition('active');
          }
        },
        createPath: {
          _onEnter: () => {
            this.currentLines.clear();
            this.currentPoints.clear();
            this.currentStaffLines.clear();
          },
          _onExit: () => {
            this.newPoints.clear();
          },
          delete: () => {
            this.currentLines.clear();
            this.currentPoints.clear();
            this.currentStaffLines.clear();
            this.newPoints.clear();
            this.states.transition('active');
          },
          cancel: () => { this.states.handle('delete'); },
          finish: () => {
            this.actions.startAction(ActionType.StaffLinesNew);
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
            this.states.transition('active');
            this.actions.changeSet(this.currentLines, new Set<PolyLine>(), this.currentLines);
            this.actions.finishAction();
          },
          selectionBox: 'selectionBox',
        },
        selectPointHold: {
          move: 'movePoint',
          idle: 'idle',
          edit: 'active',
          _onEnter: () => {
            this.actions.startAction(ActionType.StaffLinesEditPoints, arrayFromSet(this.currentStaffLines));
          }
          // _onExit() only finishes Action if new state is not move point (see constructor)
        },
        appendPoint: {
          _onEnter: () => {
            this._selectionToNewPoints(this.prevMousePoint);
            this.viewChanges.request(arrayFromSet(this.currentStaffLines));
          },
          _onExit: () => {
            this._deleteNewPoints();
            this.viewChanges.request(arrayFromSet(this.currentStaffLines));
          },
          move: () => {
            this.viewChanges.request(arrayFromSet(this.currentStaffLines));
          },
          cancel: 'active',
          edit: 'active',
          idle: 'idle',
        },
        movePoint: {
          move: () => {
            this.viewChanges.request(arrayFromSet(this.currentStaffLines));
          },
          edit: () => {
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
            this.currentLines.forEach(line => {this.lineUpdated.emit(line); });
            this.actions.finishAction();
          },
        },
        selectPath: {
          cancel: 'active',
          finished: 'active',
          move: 'movePath',
          _onEnter: () => {
            this.actions.startAction(ActionType.StaffLinesEditPath, arrayFromSet(this.currentStaffLines));
          }
          // _onExit() only finishes Action if new state is not move point (see constructor)
        },
        movePath: {
          move: () => {
            this.viewChanges.request(arrayFromSet(this.currentStaffLines));
          },
          finished: () => {
            this.movingPoints.forEach(mp => this.actions.changePoint2(mp.p, mp.init));
            this.movingPoints = [];
            this.movingLines.forEach(ml => this.actions.changePolyLine2(ml.l, ml.init));
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
            this.currentLines.forEach(line => this.lineUpdated.emit(line));
            this.actions.finishAction();
          },
        }
      }
    });
    this._states = this.lineEditorService.states;
  }

  ngOnInit() {
    this.states.on('transition', (data: {fromState: string, toState: string}) => {
      if (data.fromState === 'selectPointHold' && data.toState !== 'movePoint') {
        this.actions.finishAction();
      } else if (data.fromState === 'selectPath' && data.toState !== 'movePath') {
        this.actions.finishAction();
      }
      this.changeDetector.markForCheck();
    });
  }

  private _selectionToNewPoints(center: Point = null): void {
    const oldPoints = new Set<Point>(); this.newPoints.forEach(p => oldPoints.add(p));
    this.newPoints.clear();

    if (this.state === 'createPath') {
      // do not write actions on a new line, line is added as a whole to the actions if createPath finished
      if (this.currentLines.size === 0) {
        // add initial points
        const line = new PolyLine([center ? center : new Point(0, 0), center ? center.copy() : new Point(0, 0)], false);
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
      this.actions.startAction(ActionType.StaffLinesNewPoint);
      if (this.currentPoints.size > 0) {
        const apCenter = new Point(0, 0);
        this.currentLines.forEach(line => {
          // current line state as 'to' and 'line - selected points' as from
          const newPoints = line.points.map(p => p);
          line.points = line.points.filter(p => !oldPoints.has(p));
          this.actions.changePolyLine(line, line, new PolyLine(newPoints));
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
          this.actions.changePolyLine(line, line, new PolyLine(newPoints));

          // add new point
          const point = center ? center : new Point(0, 0);
          line.points.push(point);
          this.newPoints.add(point);
        });
      } else {
        console.log('Error this code should never be reached, since it only serves for new lines (state=createPath)');
        return;
      }

      this._sortCurrentLines();
      this.actions.finishAction();
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
    const r = this.editorService.pcgts.page.staffLinePointsInRect(rect);
    this._setSet(this.currentPoints, arrayFromSet(r.points));
    this._setSet(this.currentStaffLines, arrayFromSet(r.staffLines));
    this._setSet(this.currentLines, arrayFromSet(r.staffLines).map(s => s.coords));
    this.states.handle('edit');
  }

  onMouseDown(event: MouseEvent) {
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
      } else {
        this.states.handle('holdNew');
      }
    }
    event.preventDefault();
  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.prevMousePoint = p;

    if (this.states.state === 'newPointHold') {
      this.states.handle('createPath');
      this._selectionToNewPoints(p);
      this.changeDetector.markForCheck();
    } else if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      this._selectionToNewPoints(p);
      this.changeDetector.markForCheck();
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
  }

  onMouseMove(event: MouseEvent) {
    if (event.defaultPrevented) { return; }
    const p = this.mouseToSvg(event);
    const d: Size = (this.prevMousePoint) ? p.measure(this.prevMousePoint) : new Size(0, 0);
    this.prevMousePoint = p;

    if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      this.states.handle('move');
      this.newPoints.forEach(point => point.translateLocal(d));
      this._sortCurrentLines();
      this.changeDetector.markForCheck();
    } else if (this.states.state === 'movePoint' || this.states.state === 'selectPointHold') {
      this.states.handle('move');
      this.currentPoints.forEach(point => point.translateLocal(d));
      this._sortCurrentLines();
      this.changeDetector.markForCheck();
    } else if (this.states.state === 'selectPath' || this.state === 'movePath') {
      this.states.handle('move');
      this.currentLines.forEach((line) => {line.translateLocal(d); });
      this.changeDetector.markForCheck();
    } else if (this.states.state === 'selectionBox') {
    }
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
      this.actions.changeSet2(this.currentPoints, prev);
      event.preventDefault();
    } else if (this.states.state === 'createPath' || this.states.state === 'appendPoint') {
      if (this.newPoints.has(point)) {
        this.onMouseDown(event);
      }
    }
  }

  onPointMouseUp(event: MouseEvent, point) {
    event.preventDefault();
    if (this.states.state === 'selectPointHold') {
      this._setSet(this.currentPoints, [point]);
      this.states.handle('edit');
    } else {
      this.onMouseUp(event);
    }
  }

  onStaffLineMouseDown(event: MouseEvent, staffLine: StaffLine) {
    if (this.states.state === 'active') {
      const oldStaffLines = copySet(this.currentStaffLines);
      this._setSet(this.currentStaffLines, [staffLine]);

      this.states.handle('selectPath');
      this.actions.changeSet(this.currentStaffLines, oldStaffLines, setFromList([staffLine]))
      this.actions.changeSet(this.currentPoints, this.currentPoints, new Set<Point>());
      this.actions.changeSet(this.currentLines, copySet(this.currentLines), setFromList([staffLine.coords]));
      this.changeDetector.markForCheck();
      event.preventDefault();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    } else if (event.code === 'KeyA' && event.ctrlKey) {
      this.states.handle('cancel');
      this.currentPoints.clear();
      this.currentLines.clear();
      this.editorService.pcgts.page.musicRegions.forEach(mr => mr.musicLines.forEach(ml => ml.staffLines.forEach(sl => {
        this.currentLines.add(sl.coords);
        sl.coords.points.forEach(p => this.currentPoints.add(p));
      })));
      this.states.handle('edit');
      event.preventDefault();
    } else if (this.states.state === 'createPath') {
      if (event.code === 'Delete') {
        this.states.handle('delete');
        event.preventDefault();
      } else if (event.code === 'Enter') {
        this.states.handle('finish');
        event.preventDefault();
      }
    } else if (this.states.state === 'active') {
      if (event.code === 'Delete') {
        const oldCurrentLines = copySet(this.currentLines);
        this.actions.startAction(ActionType.StaffLinesDelete);
        if (this.currentPoints.size > 0) {
          this.currentLines.forEach(line => {
            this.actions.changePolyLine(line, line, new PolyLine(
                line.points.filter(p => !this.currentPoints.has(p))
            ));
            this.lineUpdated.emit(line);
            if (line.points.length <= 1) {
              this.lineDeleted.emit(line);
            }
          });
        } else {
          this.currentLines.forEach((line) => this.lineDeleted.emit(line));
        }
        this.actions.changeSet(this.currentLines, oldCurrentLines, new Set<PolyLine>());
        this.actions.changeSet(this.currentPoints, this.currentPoints, new Set<Point>());
        this.actions.changeSet(this.currentStaffLines, this.currentStaffLines, new Set<StaffLine>());
        this.actions.finishAction();
        event.preventDefault();
      } else if (event.code === 'ControlLeft') {
        this.states.handle('append');
        event.preventDefault();
      }
    } else if (this.states.state === 'appendPoint') {

    }
  }

  onKeyup(event: KeyboardEvent) {
    if (this.states.state === 'appendPoint') {
      if (event.code === 'ControlLeft') {
        this.states.handle('edit');
        event.preventDefault();
      }
    } else if (this.states.state === 'selectionBox') {
      if (event.code === 'ShiftLeft') {
        this.states.handle('cancel');
      }
    }
  }

  receivePageMouseEvents(): boolean { return this.state === 'active'; }
  isLineSelectable(line: PageLine): boolean { return true; }
  isStaffLineSelectable(sl: StaffLine): boolean { return true; }
  useMoveCursor(): boolean { return this.state === 'selectPointHold' || this.state === 'movePoint' || this.state === 'movePath' || this.state === 'selectPath'; }
}
