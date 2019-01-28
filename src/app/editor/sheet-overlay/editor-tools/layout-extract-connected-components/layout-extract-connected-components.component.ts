import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ActionsService} from '../../../actions/actions.service';
import {Point, PolyLine, SingleSelect} from '../../../../geometry/geometry';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ActionType} from '../../../actions/action-types';
import {BlockType} from '../../../../data-types/page/definitions';
import {PageLine} from '../../../../data-types/page/pageLine';
import {ContextMenusService} from '../../context-menus/context-menus.service';
import {RegionTypesContextMenu} from '../../context-menus/region-type-context-menu/region-type-context-menu.service';
import {RegionTypeContextMenuComponent} from '../../context-menus/region-type-context-menu/region-type-context-menu.component';
import {LayoutPropertyWidgetService} from '../../../property-widgets/layout-property-widget/layout-property-widget.service';

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
  ) {
    super(sheetOverlayService);

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

  onTextLineMouseDown(event: MouseEvent, textLine: PageLine) {
    if (event.button !== 0) { return; }
    const p = this.mouseToSvg(event);
    this.states.handle('mouseDown', {pos: p, line: textLine});

    event.preventDefault();
  }

  onMusicLineMouseDown(event: MouseEvent, textLine: PageLine) {
    if (event.button !== 0) { return; }
    const p = this.mouseToSvg(event);
    this.states.handle('mouseDown', {pos: p, line: textLine});

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
    setTimeout(() => {
      this.contextMenuService.regionTypeMenuExec(this.currentMousePos);
    });
  }

  onRegionTypeSelected(type: RegionTypesContextMenu) {
    if (type === RegionTypesContextMenu.Closed) {
      return;
    }
    this.actions.startAction(ActionType.LayoutChangeType);
    const newBlock = this.actions.addNewBlock(this.lineToBeChanged.getBlock().page, type as number as BlockType);
    this.actions.attachLine(newBlock, this.lineToBeChanged);
    this.actions.finishAction();
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
    this.actions.startAction(ActionType.LayoutExtractCC);
    const page = this.sheetOverlayService.editorService.pcgts.page;
    const type = this.originLine ? this.originLine.getBlock().type : this.layoutWidget.regionType;

    let foreigenRegions = new Array<PageLine>();
    let siblingRegions = new Array<PageLine>();

    if (this.originLine) { siblingRegions.push(this.originLine); }

    page.blocks.forEach(block => block.lines.filter(line => line !== this.originLine).forEach(line => {
      line.update();
      polyLines.forEach(pl => {
        if (pl.aabb().intersetcsWithRect(line.AABB) && PolyLine.multiUnionFilled([pl, line.coords]).length === 1) {
          foreigenRegions.push(line);
        }
      });
    }));

    // make arrays unique
    foreigenRegions = foreigenRegions.filter((v, i, a) => a.indexOf(v) === i);
    siblingRegions = siblingRegions.filter((v, i, a) => a.indexOf(v) === i);

    if (type === BlockType.Music && siblingRegions.length > 1 && this.closestStaff) {
      // closer region to mouse:
      siblingRegions = [this.closestStaff];
    }

    if (siblingRegions.length === 1) {
      const seCoords = siblingRegions.map(fr => fr.coords);
      const outPl = PolyLine.multiUnionFilled([...seCoords, ...polyLines]).filter(pl => pl.difference(seCoords[0]).points.length !== 0);
      if (outPl.length === 1) {
        this.actions.changePolyLine(siblingRegions[0].coords, siblingRegions[0].coords, outPl[0]);
      } else {
        console.log('Warning');
      }
    } else if (type !== BlockType.Music) {
      const seCoords = siblingRegions.map(fr => fr.coords);
      const newBlock = this.actions.addNewBlock(page, type);
      PolyLine.multiUnionFilled([...seCoords, ...polyLines]).forEach(pl => {
        const newLine = this.actions.addNewLine(newBlock);
        newLine.coords = pl;
      });
      siblingRegions.forEach(sr => this.actions.detachRegion(sr));
    }

    foreigenRegions.forEach(fr => {
      let toCoords = fr.coords.copy();
      polyLines.forEach(pl => toCoords = toCoords.difference(pl, SingleSelect.Maximum));
      if (toCoords.length === 0) {
        this.actions.detachRegion(fr);
      } else {
        this.actions.changePolyLine(fr.coords, fr.coords, toCoords);
      }
    });

    this.actions.finishAction();
  }

  isLineSelectable(line: PageLine): boolean { return this.state === 'active'; }
  useCrossHairCursor(): boolean { return this.state === 'active'; }
}
