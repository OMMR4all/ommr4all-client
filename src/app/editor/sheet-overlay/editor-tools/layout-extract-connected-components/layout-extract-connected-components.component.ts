import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ActionsService} from '../../../actions/actions.service';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ActionType} from '../../../actions/action-types';
import {BlockType} from '../../../../data-types/page/definitions';
import {PageLine} from '../../../../data-types/page/pageLine';
import {ContextMenusService} from '../../context-menus/context-menus.service';
import {RegionTypesContextMenu} from '../../context-menus/region-type-context-menu/region-type-context-menu.service';
import {RegionTypeContextMenuComponent} from '../../context-menus/region-type-context-menu/region-type-context-menu.component';
import {LayoutPropertyWidgetService} from '../../../property-widgets/layout-property-widget/layout-property-widget.service';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';

const machina: any = require('machina');

@Component({
  selector: '[app-layout-extract-connected-components]',  // tslint:disable-line component-selector
  templateUrl: './layout-extract-connected-components.component.html',
  styleUrls: ['./layout-extract-connected-components.component.css']
})
export class LayoutExtractConnectedComponentsComponent extends EditorTool implements OnInit {
  regionTypeMenu: RegionTypeContextMenuComponent;
  drawedLine = new PolyLine([]);
  originLine: PageLine = null;
  closestStaff: PageLine = null;
  currentMousePos = new Point(0, 0);
  lineToBeChanged: PageLine = null;

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private actions: ActionsService,
    private changeDetector: ChangeDetectorRef,
    private contextMenuService: ContextMenusService,
    private http: HttpClient,
    private layoutWidget: LayoutPropertyWidgetService,
    protected viewChanges: ViewChangesService,
  ) {
    super(sheetOverlayService, viewChanges,
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
            this.originLine = args.line;
            this.drawedLine = new PolyLine([args.pos]);
            this.closestStaff = this.sheetOverlayService.closestStaffToMouse;
          },
          _onExit: () => {
          },
          mouseUp: (args) => {
            this.states.transition('waitingForResponse');
            this._requestExtract();
          },
          mouseMove: (args) => {
            this.drawedLine.points.push(args.pos);
            this.changeDetector.markForCheck();
          },
          cancel: 'active',
        },
        waitingForResponse: {
          cancel: 'active',
          error: 'active',
          dataReceived: (args: Array<PolyLine>) => {
            this._extract(args);
            this.states.transition('active');
          }
        }
      }
    });
  }

  ngOnInit() {
    this.contextMenuService.regionTypeMenu.triggered.subscribe(type => {
      if (this.state !== 'idle') {
        this.onRegionTypeSelected(type);
      }
    });
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) { return; }
    const p = this.mouseToSvg(event);
    this.states.handle('mouseDown', {pos: p, line: null});

    event.preventDefault();
  }

  onLineMouseDown(event: MouseEvent, line: PageLine) {
    if (event.button !== 0) { return; }
    const p = this.mouseToSvg(event);
    this.states.handle('mouseDown', {pos: p, line: line});

    event.preventDefault();
  }

  onMouseUp(event: MouseEvent): void {
    const p = this.mouseToSvg(event);
    this.states.handle('mouseUp', {pos: p});
  }

  onMouseMove(event: MouseEvent): void {
    this.currentMousePos = new Point(event.clientX, event.clientY);
    if (event.defaultPrevented) { return; }
    const p = this.mouseToSvg(event);
    this.states.handle('mouseMove', {pos: p});
  }

  onLineContextMenu(event: (MouseEvent|KeyboardEvent), line: PageLine): void {
    event.preventDefault();
    this.lineToBeChanged = line;
    this.contextMenuService.regionTypeMenu.hasContext = false;
    this.contextMenuService.regionTypeMenu.hasDelete = true;
    setTimeout(() => {
      this.contextMenuService.regionTypeMenuExec(this.currentMousePos);
    });
  }

  onRegionTypeSelected(type: RegionTypesContextMenu) {
    if (type === RegionTypesContextMenu.Closed) {
      return;
    }
    if (type === RegionTypesContextMenu.Delete) {
      this.actions.startAction(ActionType.LayoutDelete);
      this.actions.detachLine(this.lineToBeChanged);
      this.actions.finishAction();
    } else {
      this.actions.startAction(ActionType.LayoutChangeType);
      const newBlock = this.actions.addNewBlock(this.lineToBeChanged.getBlock().page, type as number as BlockType);
      this.actions.attachLine(newBlock, this.lineToBeChanged);
      this.actions.finishAction();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    }
  }

  private _requestExtract() {
    return this.http.post<{polys: Array<string>}>(this.sheetOverlayService.editorService.pageCom.operation_url('layout_extract_cc_by_line'), {
      'points': this.drawedLine.toString(),
    }).pipe(
      map(r => r.polys.map(p => PolyLine.fromString(p)))
    ).subscribe(
      res => this.states.handle('dataReceived', res),
      err => this.states.handle('error'),
    );
  }

  private _extract(polyLines: Array<PolyLine>) {
    if (polyLines.length === 0) { return; }
    const page = this.sheetOverlayService.editorService.pcgts.page;
    const type = this.originLine ? this.originLine.getBlock().type : this.layoutWidget.regionType;

    this.actions.addPolyLinesAsPageLine(ActionType.LayoutExtractCC, polyLines, this.originLine, page, type);
  }

  receivePageMouseEvents(): boolean { return this.state === 'active' || this.state === 'drawLine'; }
  isLineSelectable(line: PageLine): boolean { return this.state === 'active'; }
  useCrossHairCursor(): boolean { return this.state === 'active'; }
}
