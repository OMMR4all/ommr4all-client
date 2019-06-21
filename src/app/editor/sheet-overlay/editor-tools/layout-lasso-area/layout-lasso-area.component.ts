import {AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {RegionTypeContextMenuComponent} from '../../context-menus/region-type-context-menu/region-type-context-menu.component';
import {ActionType} from '../../../actions/action-types';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ActionsService} from '../../../actions/actions.service';
import {LayoutPropertyWidgetService} from '../../../property-widgets/layout-property-widget/layout-property-widget.service';
import {PageLine} from '../../../../data-types/page/pageLine';
import {BlockType} from '../../../../data-types/page/definitions';
import {Action} from 'rxjs/internal/scheduler/Action';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';
import {Subscription} from 'rxjs';

const machina: any = require('machina');

@Component({
  selector: '[app-layout-lasso-area]',  // tslint:disable-line component-selector
  templateUrl: './layout-lasso-area.component.html',
  styleUrls: ['./layout-lasso-area.component.css']
})
export class LayoutLassoAreaComponent extends EditorTool implements OnInit, AfterViewInit, OnDestroy {
  private readonly _subscriptions = new Subscription();
  @Input() regionTypeContextMenu: RegionTypeContextMenuComponent;
  drawedLine = new PolyLine([]);
  closestStaff: PageLine = null;
  currentMousePos = new Point(0, 0);

  downLine: PageLine = null;

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private actions: ActionsService,
    protected changeDetector: ChangeDetectorRef,
    private layoutWidget: LayoutPropertyWidgetService,
    protected viewChanges: ViewChangesService,
  ) {
    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(true, false, true, false, true),
    );

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
        },
        active: {
          cancel: 'idle',
          mouseDown: (args) => this.states.transition('drawLine', args),
          _onEnter: () => {
            this.drawedLine = new PolyLine([]);
          },
        },
        drawLine: {
          _onEnter: (args) => {
            this.drawedLine = new PolyLine([args.pos]);
            this.closestStaff = this.sheetOverlayService.closestStaffToMouse;
            this.downLine = args.line;
          },
          _onExit: () => {
          },
          mouseUp: (args) => {
            console.log('mouse up', args.line, this.downLine);
            if (args.line === this.downLine) {
              this._extract(this.downLine, this.drawedLine);
              this.states.transition('active');
            } else {
              this.states.handle('cancel');
            }
          },
          mouseMove: (args) => {
            this.drawedLine.points.push(args.pos);
            this.changeDetector.markForCheck();
          },
          cancel: 'active',
        },
      }
    });
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) { return; }
    const p = this.mouseToSvg(event);
    this.states.handle('mouseDown', {pos: p, line: null});
  }

  onMouseUp(event: MouseEvent): void {
    const p = this.mouseToSvg(event);
    this.states.handle('mouseUp', {pos: p, line: null});
  }

  onMouseMove(event: MouseEvent): void {
    this.currentMousePos = new Point(event.clientX, event.clientY);
    if (event.defaultPrevented) { return; }
    const p = this.mouseToSvg(event);
    this.states.handle('mouseMove', {pos: p});
  }

  onLineMouseDown(event: MouseEvent, line: PageLine) {
    const p = this.mouseToSvg(event);
    this.states.handle('mouseDown', {pos: p, line: line});

    event.preventDefault();
  }

  onLineMouseUp(event: MouseEvent, line: PageLine) {
    const p = this.mouseToSvg(event);
    this.states.handle('mouseUp', {pos: p, line: line});

    event.preventDefault();
  }

  onLineContextMenu(event: (MouseEvent|KeyboardEvent), line: PageLine): void {
    event.preventDefault();
    this.regionTypeContextMenu.open(
      this.currentMousePos.x, this.currentMousePos.y,
      line,
      [],
      false,
      true,
    );
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    }
  }

  private _extract(line: PageLine, polyLine: PolyLine) {
    if (!polyLine) { return; }
    polyLine = polyLine.simplify(1);
    const page = this.sheetOverlayService.editorService.pcgts.page;
    const type = line ? line.getBlock().type : this.layoutWidget.regionType;
    this.actions.addPolyLinesAsPageLine(ActionType.LayoutLassoArea, [polyLine], line, page, type);
    /*polyLine = polyLine.simplify(1);
    const initialPolyLineCoords = line.coords.copy();
    let line_points = line.coords.points;

    if (polyLine.isClockWise()) {
      polyLine.points = polyLine.points.reverse();
    }
    if (line.coords.isClockWise()) {
      line_points = line.coords.points.reverse();
    }


    let regionStartIndex = 0;
    let regionEndIndex = line.coords.points.length - 1;
    let startInterP = null;
    let endInterP = null;
    let startDrawIndex = 0;
    let endDrawIndex = polyLine.points.length - 1;
    for (let drawIndex = 0; drawIndex < polyLine.points.length - 1; drawIndex++) {
      for (let i = 0; i < line_points.length; i++) {
        const edge = new Line(line_points[i], line_points[(i + 1) % line_points.length]);
        const interP = edge.intersection(new Line(polyLine.points[drawIndex], polyLine.points[drawIndex + 1]));
        if (interP) {
          startInterP = interP;
          startDrawIndex = drawIndex;
          regionStartIndex = i;
          break;
        }
      }
      if (startInterP) { break; }
    }
    for (let drawIndex = polyLine.points.length - 2; drawIndex >= 0; drawIndex--) {
      for (let i = 0; i < line_points.length; i++) {
      const edge = new Line(line_points[i], line_points[(i + 1) % line_points.length]);
        const interP = edge.intersection(new Line(polyLine.points[drawIndex], polyLine.points[drawIndex + 1]));
        if (interP) {
          endInterP = interP;
          endDrawIndex = drawIndex;
          regionEndIndex = i;
          break;
        }
      }
      if (endInterP) { break; }
    }

    if (!endInterP || !startInterP) {
      return;  // no collision
    }

    this.actions.startAction(ActionType.LayoutLassoArea);

    polyLine.points = polyLine.points.slice(startDrawIndex, endDrawIndex + 1);

    let newPoints;
    newPoints = [
      ...line_points.slice(0, regionStartIndex + 1),
      startInterP,
      ...polyLine.points,
      endInterP,
      ...line_points.slice(regionEndIndex + 1, line_points.length),
    ];

    this.actions.changePolyLine(line.coords, initialPolyLineCoords, new PolyLine(newPoints));

    const aabb = line.coords.aabb();
    this.sheetOverlayService.editorService.pcgts.page.blocks.forEach(line => line.lines.forEach(
      l => {
        if (l !== line && l.coords.aabb().intersetcsWithRect(aabb)) {
          this.actions.changePolyLine(l.coords, l.coords, l.coords.differenceSingle(line.coords));
        }
      }
    ));

    this.actions.finishAction();*/
  }

  receivePageMouseEvents(): boolean { return this.state !== 'idle'; }
  isLineSelectable(line: PageLine): boolean { return this.state === 'active'; }
  useCrossHairCursor(): boolean { return this.state === 'active'; }

}
