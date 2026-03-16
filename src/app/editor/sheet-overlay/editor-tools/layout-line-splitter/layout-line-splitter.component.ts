import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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

import machina from 'machina';

@Component({
       selector: '[app-layout-line-splitter]',
    templateUrl: './layout-line-splitter.component.html',
    styleUrls: ['./layout-line-splitter.component.scss'],
    standalone: false
})
export class LayoutLineSplitterComponent extends EditorTool implements OnInit {
  protected sheetOverlayService: SheetOverlayService;
  private lineSplitterService = inject(LayoutLineSplitterService);
  protected changeDetector: ChangeDetectorRef;
  private actions = inject(ActionsService);
  protected viewChanges: ViewChangesService;
  private hotkeys = inject(ShortcutService);


  private clickPos: Point;
  private curPos: Point;
  private region: PageLine;

  left: number;
  right: number;
  top = 10;
  bot = 100;
  midDelete: [number, number] = [0, 0];
  readonly tooltips: Partial<Options>[] = [
       { keys: this.hotkeys.symbols().mouse1 + ' + hold', description: 'Split or Shrink lyric lines', group: EditorTools.Layout},
  ];
  constructor() {
    const sheetOverlayService = inject(SheetOverlayService);
    const changeDetector = inject(ChangeDetectorRef);
    const viewChanges = inject(ViewChangesService);

    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(false, false, true, false, true),
    );
    this.sheetOverlayService = sheetOverlayService;
    this.changeDetector = changeDetector;
    this.viewChanges = viewChanges;


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

      if (this.region) {
        this.bot = this.region.AABB.bottom;
        this.top = this.region.AABB.top;
        this.clickPos = p;
        this.curPos = p;
        this._updatePos();
        this.states.handle('startDrag');
      }
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
      const originalPoints = region.coords.points;

      const getVerticalIntersection = (p1: Point, p2: Point, splitX: number): Point => {
        if (p1.x === p2.x) return new Point(splitX, p1.y);

        const ratio = (splitX - p1.x) / (p2.x - p1.x);
        const intersectY = p1.y + (p2.y - p1.y) * ratio;

        return new Point(splitX, intersectY);
      };

      const clipPolyline = (points: Point[], splitX: number, keepSide: 'left' | 'right'): Point[] => {
        const clippedPoints: Point[] = [];
        if (!points || points.length === 0) return clippedPoints;

        const firstInside = keepSide === 'left' ? points[0].x <= splitX : points[0].x >= splitX;
        if (firstInside) {
          clippedPoints.push(points[0]);
        }

        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];

          const p1Inside = keepSide === 'left' ? p1.x <= splitX : p1.x >= splitX;
          const p2Inside = keepSide === 'left' ? p2.x <= splitX : p2.x >= splitX;

          if (p1Inside && p2Inside) {
            clippedPoints.push(p2);
          } else if (p1Inside && !p2Inside) {
            clippedPoints.push(getVerticalIntersection(p1, p2, splitX));
          } else if (!p1Inside && p2Inside) {
            clippedPoints.push(getVerticalIntersection(p1, p2, splitX));
            clippedPoints.push(p2);
          }
        }
        return clippedPoints;
      };

      const leftNewArrayPoints = clipPolyline(originalPoints, this.left, 'left');
      const rightNewArrayPoints = clipPolyline(originalPoints, this.right, 'right');

      if (leftNewArrayPoints.length > 0) {
        const plsLeft = new PageLine();
        plsLeft.coords = new PolyLine(leftNewArrayPoints);
        this.actions.attachLine(region.getBlock(), plsLeft);
      }

      if (rightNewArrayPoints.length > 0) {
        const plsRight = new PageLine();
        plsRight.coords = new PolyLine(rightNewArrayPoints);
        plsRight.documentStart = true;
        this.actions.attachLine(region.getBlock(), plsRight);
      }

      if (leftNewArrayPoints.length > 0 || rightNewArrayPoints.length > 0) {
        this.actions.detachLine(region);
      }
    }

    this.actions.finishAction();
  }
}
