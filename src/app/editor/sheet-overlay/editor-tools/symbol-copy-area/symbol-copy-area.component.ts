import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ActionsService} from '../../../actions/actions.service';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {Options, ShortcutService} from '../../../shortcut-overlay/shortcut.service';
import {ViewSettings} from '../../views/view';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {PageLine} from '../../../../data-types/page/pageLine';
import {EditorTools} from '../../../tool-bar/tool-bar-state.service';
import {EditorTool} from '../editor-tool';
import {ActionType} from '../../../actions/action-types';
import {MusicSymbol} from "../../../../data-types/page/music-region/symbol";

const machina: any = require('machina');

@Component({
  selector: '[app-symbol-copy-area]',
  templateUrl: './symbol-copy-area.component.html',
  styleUrls: ['./symbol-copy-area.component.scss']
})
export class SymbolCopyAreaComponent extends EditorTool implements OnInit {
  private clickPos: Point;
  private curPos: Point;
  private staff: PageLine;
  private staff2: PageLine;

  left: number;
  right: number;
  top = 10;
  bot = 100;
  midDelete: [number, number] = [0, 0];

  left2: number;
  top2 = 10;
  bot2 = 100;

  readonly tooltips: Array<Partial<Options>> = [
    // tslint:disable-next-line:max-line-length
    { keys: this.hotkeys.symbols().mouse1 + ' + hold', description: 'Split or Shrink selected staff lines', group: EditorTools.GroupStaffLines},
  ];
  constructor(    protected sheetOverlayService: SheetOverlayService,
                  protected changeDetector: ChangeDetectorRef,
                  private actions: ActionsService,
                  protected viewChanges: ViewChangesService,
                  private hotkeys: ShortcutService,
  ) {

    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(true, false, false, true, true),
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
            //this.staff = null;
          },
          cancel: () => {
            this.states.transition('active');
            this.staff = null;
          },
          finish: () => {
            this.states.transition('copy');
          },
        },
        copy: {
          _onExit: () => {
            this.staff = null;
            this.staff2 = null;
          },
          cancel: () => {
            this.states.transition('active');
          },
          finish: () => {
            this._copy_symbols();
            this.states.transition('active');
          },
        }
      }
    });
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
    this.midDelete = sort([Math.max(this.staff.AABB.left, this.left), Math.min(this.staff.AABB.right, this.right)]);
  }


  onMouseDown(event: MouseEvent) {
    const sort = (t: [number, number]): [number, number] => {
      if (t[0] > t[1]) {
        return [t[1], t[0]];
      }
      return t;
    };
    if (this.state === 'idle') {
      return;
    }

    const p = this.mouseToSvg(event);
    if (this.state === 'active') {
      this.staff = this.sheetOverlayService.closestStaffToMouse;
      this.bot = this.staff.AABB.bottom;
      this.top = this.staff.AABB.top;
      this.clickPos = p;
      this.curPos = p;
      this._updatePos();
      this.states.handle('startDrag');
    }
    if (this.state === 'copy') {
      this.staff2 = this.sheetOverlayService.closestStaffToMouse;
      this.bot2 = this.staff2.AABB.bottom;
      this.top2 = this.staff2.AABB.top;
      this.clickPos = p;
      this.curPos = p;
      this.left2 = this.curPos.x;
  }
    event.preventDefault();
  }

  onMouseUp(event: MouseEvent): void {
    if (this.state === 'idle') { return; }
    if (this.state === 'copy') {
      this.states.handle('finish');
    }
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
    if (this.state === 'copy') {
      this.staff2 = this.sheetOverlayService.closestStaffToMouse;
      this.bot2 = this.staff2.AABB.bottom;
      this.top2 = this.staff2.AABB.top;
      this.clickPos = p;
      this.curPos = p;
      this.left2 = this.curPos.x;
    }
    event.preventDefault();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    }
  }

  private _copy_symbols() {
    this.actions.startAction(ActionType.SymbolsCopyArea);
    const symbolsToCopy: MusicSymbol[] = this.staff.symbols.filter(s => s.coord.x > this.left && s.coord.x < this.right);
    const diff: number = this.left2 - symbolsToCopy[0].coord.x;
    symbolsToCopy.forEach(s => {
      const copySymbol: MusicSymbol = MusicSymbol.fromJson(s.toJson());
      const p: Point = this.staff2.computeCoordByPositionInStaff(s.coord.x + diff, s.staffPosition);
      copySymbol.coord = p;
      copySymbol.missing = true;
      this.actions.attachSymbol(this.staff2, copySymbol);
      this.actions.sortSymbolIntoStaff(copySymbol);

    }
  );

/*    const leftPolyLines = staff.staffLines.map(sl => {
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
    this.actions.detachLine(staff);*/
    this.actions.finishAction();
  }

}

