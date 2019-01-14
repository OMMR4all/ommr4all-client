import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ActionsService} from '../../../actions/actions.service';
import {PolyLine} from '../../../../geometry/geometry';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ActionType} from '../../../actions/action-types';
import {BlockType} from '../../../../data-types/page/definitions';
import {Line} from '../../../../data-types/page/line';

const machina: any = require('machina');
// const cv = require('opencv.js');

@Component({
  selector: '[app-layout-extract-connected-components]',  // tslint:disable-line component-selector
  templateUrl: './layout-extract-connected-components.component.html',
  styleUrls: ['./layout-extract-connected-components.component.css']
})
export class LayoutExtractConnectedComponentsComponent extends EditorTool implements OnInit {
  drawedLine = new PolyLine([]);

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private actions: ActionsService,
    private changeDetector: ChangeDetectorRef,
    private http: HttpClient,
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
            this.drawedLine = new PolyLine([args.pos]);
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
  }

  onMouseDown(event: MouseEvent): void {
    const p = this.mouseToSvg(event);
    this.states.handle('mouseDown', {pos: p});
  }

  onMouseUp(event: MouseEvent): void {
    const p = this.mouseToSvg(event);
    this.states.handle('mouseUp', {pos: p});
  }

  onMouseMove(event: MouseEvent): void {
    if (event.defaultPrevented) { return; }
    const p = this.mouseToSvg(event);
    this.states.handle('mouseMove', {pos: p});
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
    const type = BlockType.Lyrics;

    const foreigenRegions = new Array<Line>();
    const siblingRegions = new Array<Line>();

    page.blocks.forEach(block => block.lines.forEach(line => {
      line.update();
      polyLines.forEach(pl => {
        if (pl.aabb().intersetcsWithRect(line.AABB) && pl.difference(block.coords)) {
          if (type !== block.type) {
            foreigenRegions.push(line);
          } else {
            siblingRegions.push(line);
          }
        }
      });
    }));

    const seCoords = siblingRegions.map(fr => fr.coords);
    const newBlock = this.actions.addNewBlock(page, type);
    PolyLine.multiUnion([...seCoords, ...polyLines]).forEach(pl => {
      const newLine = this.actions.addNewLine(newBlock);
      newLine.coords = pl;
    });
    siblingRegions.forEach(sr => this.actions.detachRegion(sr));

    foreigenRegions.forEach(fr => {
      const origCoords = fr.coords.copy();
      polyLines.forEach(pl => fr.coords = fr.coords.difference(pl));
      this.actions.changePolyLine(fr.coords, origCoords, fr.coords);
    });

    this.actions.finishAction();
  }

}
