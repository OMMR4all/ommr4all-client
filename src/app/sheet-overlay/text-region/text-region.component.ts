import { Component, OnInit } from '@angular/core';
import {Point, Line} from '../../geometry/geometry';
import {ToolBarStateService} from '../../tool-bar/tool-bar-state.service';
import {SheetOverlayService} from '../sheet-overlay.service';
import {StaffsService} from '../../staffs.service';
import {TextRegionService} from './text-region.service';
import {EditorTool} from '../editor-tool';
import {Http} from '@angular/http';
import { TextLine } from '../../data-types/text-line';

const machina: any = require('machina');

@Component({
  selector: '[app-text-region]',
  templateUrl: './text-region.component.html',
  styleUrls: ['./text-region.component.css']
})
export class TextRegionComponent extends EditorTool implements OnInit {
  private states = new machina.Fsm({
    initialState: 'idle',
    states: {
      idle: {
        drag: 'dragLine',
        _onEnter: () => {
          this.dragLine = null;
        }
      },
      dragLine: {
        finished: 'idle'
      }
    }

  });

  dragLine: Line;
  textLine: TextLine;

  constructor(
    private http: Http,
    public textRegionService: TextRegionService,
    private toolBarStateService: ToolBarStateService,
    protected sheetOverlayService: SheetOverlayService,
    private staffService: StaffsService) {
    super(sheetOverlayService);

    this.textRegionService.states = this.states;
  }

  ngOnInit() {
  }

  onMouseDown(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    this.dragLine = new Line(p, p);
    this.states.handle('drag');
  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    if (this.states.state === 'dragLine') {
      this._requestTextLine(this.dragLine);
      this.states.handle('finished');
    }

  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    if (this.states.state === 'dragLine') {
      this.dragLine.p2 = p;
    }
  }

  private _requestTextLine(guessLine: Line) {
    this.http.post(this.staffService.page.operation_url('text_polygones'), guessLine.toPolyline().toJSON()).subscribe(
      body => {
        this.textLine = TextLine.fromJson(body.json());
      }
    );
  }


}
