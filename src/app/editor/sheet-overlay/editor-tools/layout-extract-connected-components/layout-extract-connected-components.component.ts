import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ActionsService} from '../../../actions/actions.service';
import {PolyLine} from '../../../../geometry/geometry';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ActionType} from '../../../actions/action-types';
import {BlockType} from '../../../../data-types/page/definitions';

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
    // TODO:
    /*this.actions.startAction(ActionType.LayoutExtractCC);
    const page = this.sheetOverlayService.editorService.pcgts.page;
    const isMusicRegion = false;
    const textRegionType = BlockType.Lyrics;

    const foreigenRegions = new Array<PolyLine>();
    const siblingRegions = new Array<PolyLine>();

    page.musicRegions.forEach(mr => mr.musicLines.forEach(ml => {
      let found = false;
      if (isMusicRegion) {
        polyLines.forEach(pl => {
          if (pl.aabb().intersetcsWithRect(ml.AABB) && pl.difference(mr.coords)) {
            found = true;
          }
        });
      }
      if (found) {
        siblingRegions.push(ml.coords);
      } else {
        foreigenRegions.push(ml.coords);
      }
    }));

    page.textRegions.forEach(tr => {
      if (tr.typeAllowsTextLines()) {
        const textLinesToJoin = new Array<PolyLine>(...polyLines);
        tr.textLines.forEach(tl => polyLines.forEach(pl => {
          const diff = tl.coords.difference(pl);
          if (diff !== tl.coords) {
            if (!isMusicRegion && textRegionType !== tr.type) {
              foreigenRegions.push(tl.coords);
            } else {
              textLinesToJoin.push(tl.coords);
              this.actions.detachTextLine(tl);
            }
          }
        }));
        const newTr = this.actions.addNewTextRegion(textRegionType, page);
        const newTextLines = PolyLine.multiUnion(textLinesToJoin);
        newTextLines.forEach(pl => {
          const newTl = this.actions.addNewTextLine(newTr);
          newTl.coords = pl;
        });
      }
    });

    foreigenRegions.forEach(fe => {
      let toPolyline = fe.copy();
      polyLines.forEach(pl => toPolyline = toPolyline.difference(pl));
      this.actions.changePolyLine(fe, fe, toPolyline);
    });



    this.actions.finishAction();*/
  }

}
