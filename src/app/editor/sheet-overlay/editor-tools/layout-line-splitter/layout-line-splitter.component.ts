import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {PageLine} from '../../../../data-types/page/pageLine';
import {Options, ShortcutService} from '../../../shortcut-overlay/shortcut.service';
import {EditorTools} from '../../../tool-bar/tool-bar-state.service';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ActionsService} from '../../../actions/actions.service';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';
import {ActionType} from '../../../actions/action-types';
import {EditorTool} from '../editor-tool';
import {LayoutLineSplitterService} from './layout-line-splitter.service';
import {BlockType} from '../../../../data-types/page/definitions';

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
  private region: PageLine;

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
    private lineSplitterService: LayoutLineSplitterService,
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
              this._splitRegion(this.region);
            }
            this.states.transition('active');
          },
        }
      }
    });
    this.lineSplitterService.states = this._states;
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
      this.region = this.sheetOverlayService.closestLyricLineToMouse;
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

  private _splitRegion(region: PageLine) {
    this.actions.startAction(ActionType.LayoutRegionSplit);
    if (region && region.blockType === BlockType.Lyrics) {

      let intersects = region.coords.intersects_with_array(this.left);
      const leftNewArrayPoints = [];
      for (let i = 0;  i < region.coords.points.length; i++) {
        if (region.coords.points[i].x < this.left) {
          leftNewArrayPoints.push(region.coords.points[i]);
        }
      }
      let max = 0;
      let indexL = 0;

      for (let i = 0, l = leftNewArrayPoints.length; i < l; i++) {
        if (leftNewArrayPoints[i].x > max) {
          max = leftNewArrayPoints[i].x;
          indexL = i;
        }
      }
      let prevIndexL = indexL - 1;
      if (prevIndexL < 0) {
        prevIndexL = leftNewArrayPoints.length - 1;
      }
      let nextIndexL = indexL + 1;
      if (nextIndexL > leftNewArrayPoints.length - 1) {
        nextIndexL = 0;
      }
      if (Math.abs(leftNewArrayPoints[indexL].y - leftNewArrayPoints[nextIndexL].y) > Math.abs(leftNewArrayPoints[indexL].y - leftNewArrayPoints[prevIndexL].y)) {
        //insert after
        intersects.sort(p => Math.abs(leftNewArrayPoints[indexL].y - p.y ));
        leftNewArrayPoints.splice(indexL + 1, 0, ...intersects);
      }
      else {
        // insert before
        intersects.sort(p => Math.abs(leftNewArrayPoints[indexL].y - p.y ));
        leftNewArrayPoints.splice(indexL, 0, ...intersects);
      }

      intersects = region.coords.intersects_with_array(this.right);
      const rightNewArrayPoints = [];
      for (let i = 0; i < region.coords.points.length; i++) {
        if (region.coords.points[i].x > this.right) {
          rightNewArrayPoints.push(region.coords.points[i]);
        }
      }
      let min = Number.POSITIVE_INFINITY;
      let indexR = 0;
      for (let i = 0, l = rightNewArrayPoints.length; i < l; i++) {
        if (rightNewArrayPoints[i].x < min) {
          min = rightNewArrayPoints[i].x;
          indexR = i;
        }
      }
      let prevIndexR = indexR - 1;
      if (prevIndexR < 0) {
        prevIndexR = rightNewArrayPoints.length - 1;
      }
      let nextIndexR = indexR + 1;
      if (nextIndexR > rightNewArrayPoints.length - 1) {
        nextIndexR = 0;
      }
      if (Math.abs(rightNewArrayPoints[indexR].y - rightNewArrayPoints[nextIndexR].y) > Math.abs(rightNewArrayPoints[indexR].y - rightNewArrayPoints[prevIndexR].y)) {
        //insert after
        intersects.sort(p => Math.abs(rightNewArrayPoints[indexR].y - p.y )).reverse();
        rightNewArrayPoints.splice(indexR + 1, 0, ...intersects);
      }
      else {
        // insert before
        intersects.sort(p => Math.abs(rightNewArrayPoints[indexR].y - p.y )).reverse();
        rightNewArrayPoints.splice(indexR, 0, ...intersects);
      }
      // intersects.forEach(point => rightNewArrayPoints.splice(iH, 0, point));

      if (leftNewArrayPoints.length > 0) {
        const pls = new PageLine();
        pls.coords = new PolyLine(leftNewArrayPoints);
        this.actions.attachLine(region.getBlock(), pls);
    }
      if (rightNewArrayPoints.length > 0) {
        const pls = new PageLine();
        pls.coords = new PolyLine(rightNewArrayPoints);
        pls.documentStart = true;
        this.actions.attachLine(region.getBlock(), pls);
      }
      if (rightNewArrayPoints.length > 0 || leftNewArrayPoints.length > 0) {
        this.actions.detachLine(region);
      }
    }


    this.actions.finishAction();
  }
}
