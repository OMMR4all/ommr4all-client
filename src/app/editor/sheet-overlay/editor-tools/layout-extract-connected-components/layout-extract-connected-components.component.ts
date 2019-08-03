import {AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ActionsService} from '../../../actions/actions.service';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {HttpClient} from '@angular/common/http';
import {ActionType} from '../../../actions/action-types';
import {PageLine} from '../../../../data-types/page/pageLine';
import {RegionTypeContextMenuComponent} from '../../context-menus/region-type-context-menu/region-type-context-menu.component';
import {LayoutPropertyWidgetService} from '../../../property-widgets/layout-property-widget/layout-property-widget.service';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';
import {Subscription} from 'rxjs';
import {TaskWorker} from '../../../task';
import {AlgorithmRequest, AlgorithmTypes} from '../../../../book-view/book-step/algorithm-predictor-params';

const machina: any = require('machina');

@Component({
  selector: '[app-layout-extract-connected-components]',  // tslint:disable-line component-selector
  templateUrl: './layout-extract-connected-components.component.html',
  styleUrls: ['./layout-extract-connected-components.component.css']
})
export class LayoutExtractConnectedComponentsComponent extends EditorTool implements OnInit, OnDestroy, AfterViewInit {
  private _subscriptions = new Subscription();
  @Input() regionTypeContextMenu: RegionTypeContextMenuComponent;
  drawedLine = new PolyLine([]);
  originLine: PageLine = null;
  closestStaff: PageLine = null;
  currentMousePos = new Point(0, 0);
  task = new TaskWorker(
    AlgorithmTypes.LayoutConnectedComponentsSelection,
    this.http,
    this.sheetOverlayService.editorService.pageStateVal.pageCom,
    );
  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private actions: ActionsService,
    protected changeDetector: ChangeDetectorRef,
    private http: HttpClient,
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
          cancel: 'active',
          idle: 'idle',
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
    this._subscriptions.add(
      this.task.taskFinished.subscribe(res => this._taskFinished(res))
    )
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

  private _requestExtract() {
    const requestBody = new AlgorithmRequest();
    requestBody.pcgts = this.sheetOverlayService.editorService.pageStateVal.pcgts.toJson();
    requestBody.params.initialLine = this.drawedLine.toString()
    this.task.putTask(null, requestBody);
  }

  private _taskFinished(res: {polys: Array<string>}) {
    this.states.handle('dataReceived', res.polys.map(p => PolyLine.fromString(p)));
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
  useWaitCursor(): boolean { return this.state === 'waitingForResponse'; }
}
