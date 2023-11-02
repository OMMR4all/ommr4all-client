import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {PageLine} from '../../../../data-types/page/pageLine';
import {Options, ShortcutService} from '../../../shortcut-overlay/shortcut.service';
import {EditorTools} from '../../../tool-bar/tool-bar-state.service';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {StaffSplitterService} from '../staff-splitter/staff-splitter.service';
import {ActionsService} from '../../../actions/actions.service';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';
import {ActionType} from '../../../actions/action-types';
import {EditorTool} from '../editor-tool';
import {Region} from '../../../../data-types/page/region';
const machina: any = require('machina');

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[app-layout-line-splitter]',
  templateUrl: './layout-line-splitter.component.html',
  styleUrls: ['./layout-line-splitter.component.scss']
})
export class LayoutLineSplitterComponent extends EditorTool implements OnInit {

  private clickPos: Point;
  private curPos: Point;
  private region: Region;

  left: number;
  right: number;
  top = 10;
  bot = 100;
  midDelete: [number, number] = [0, 0];
  readonly tooltips: Array<Partial<Options>> = [
    // tslint:disable-next-line:max-line-length
    { keys: this.hotkeys.symbols().mouse1 + ' + hold', description: 'Split or Shrink lyric lines', group: EditorTools.Layout},
  ];
  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private staffSplitterService: StaffSplitterService,
    protected changeDetector: ChangeDetectorRef,
    private actions: ActionsService,
    protected viewChanges: ViewChangesService,
    private hotkeys: ShortcutService,
  ) {
    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(false, false, true, false, true),
    );

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          _onEnter: () => {
            this.tooltips.forEach(obj => {this.hotkeys.deleteShortcut(obj); });
          }
        },
        active: {
          _onEnter: () => {
            this.tooltips.forEach(obj => {this.hotkeys.addShortcut(obj); });

          },
          idle: 'idle',
          cancel: () => {
          },
          startDrag: 'drag',
        },
        drag: {
          _onExit: () => {
            this.region = null;
          },
          cancel: () => {
            this.states.transition('active');
          },
          finish: () => {
            if (this.region) {
              //this._splitStaff(this.region);
            }
            this.states.transition('active');
          },
        }
      }
    });
    this.staffSplitterService.states = this._states;
  }

  ngOnInit() {
    this.states.on('transition', (data: {fromState: string, toState: string}) => {
      this.changeDetector.markForCheck();
    });
  }

  private _updatePos() {
    this.left = Math.min(this.clickPos.x, this.curPos.x);
    this.right = Math.max(this.clickPos.x, this.curPos.x);
    this._updateAddDeleteAreas();
    this.changeDetector.markForCheck();
  }

  private _updateAddDeleteAreas() {
    const sort = (t: [number, number]): [number, number] => {
      if (t[0] > t[1]) { return [t[1], t[0]]; }
      return t;
    };
    this.midDelete = sort([Math.max(this.region.AABB.left, this.left), Math.min(this.region.AABB.right, this.right)]);
  }


  onMouseDown(event: MouseEvent) {
    if (this.state === 'idle') { return; }

    const p = this.mouseToSvg(event);
    if (this.state === 'active') {
      this.region = this.sheetOverlayService.closestRegionToMouse;
      console.log(this.region);
      this.bot = this.region.AABB.bottom;
      this.top = this.region.AABB.top;
      this.clickPos = p;
      this.curPos = p;
      this._updatePos();
      this.states.handle('startDrag');
    }
    event.preventDefault();
  }

  onMouseUp(event: MouseEvent): void {
    if (this.state === 'idle') { return; }

    if (this.state === 'drag') {
      this.curPos = this.mouseToSvg(event);
      this._updatePos();
      this.states.handle('finish');
    }
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent): void {
    if (this.state === 'idle') { return; }

    const p = this.mouseToSvg(event);
    this.curPos = p;
    if (this.state === 'drag') {
      this._updatePos();
    }
    event.preventDefault();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    }
  }

  private _splitStaff(staff: PageLine) {
    this.actions.startAction(ActionType.StaffLinesSplit);

    const leftPolyLines = staff.staffLines.map(sl => {
      const y = sl.coords.interpolateY(this.left);
      const points = sl.coords.points.filter(p => p.x < this.left);
      if (points.length === 0) { return null; }
      points.push(new Point(this.left, y));
      return new PolyLine(points);
    }).filter(sl => sl !== null);
    const rightPolyLines = staff.staffLines.map(sl => {
      const y = sl.coords.interpolateY(this.right);
      const points = sl.coords.points.filter(p => p.x > this.right);
      if (points.length === 0) { return null; }
      points.splice(0, 0, new Point(this.right, y));
      return new PolyLine(points);
    }).filter(sl => sl !== null);
    if (leftPolyLines.length > 0) {
      const ml = this.actions.addNewLine(staff.getBlock());
      leftPolyLines.forEach(sl => this.actions.addNewStaffLine(ml, sl));
      staff.symbols.filter(s => s.coord.x < this.left).forEach(s => {
        this.actions.attachSymbol(ml, s);
      });
      this.actions.sortStaffLines(ml.staffLines);
      this.actions.updateAverageStaffLineDistance(ml);
    }
    if (rightPolyLines.length > 0) {
      const ml = this.actions.addNewLine(staff.getBlock());
      rightPolyLines.forEach(sl => this.actions.addNewStaffLine(ml, sl));
      staff.symbols.filter(s => s.coord.x > this.right).forEach(s => {
        this.actions.attachSymbol(ml, s);
      });
      this.actions.sortStaffLines(ml.staffLines);
      this.actions.updateAverageStaffLineDistance(ml);
    }
    this.actions.detachLine(staff);
    this.actions.finishAction();
  }
}
