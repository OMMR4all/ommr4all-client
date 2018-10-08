import { Component, OnInit } from '@angular/core';
import {EditorTool} from '../editor-tool';
import {Http} from '@angular/http';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor/editor.service';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {PolyLine} from '../../../geometry/geometry';
import {ContextMenusService} from '../../context-menus/context-menus.service';
const machina: any = require('machina');

@Component({
  selector: '[app-layout-editor]',  // tslint:disable-line component-selector
  templateUrl: './layout-editor.component.html',
  styleUrls: ['./layout-editor.component.css']
})
export class LayoutEditorComponent extends EditorTool implements OnInit {
  readonly allPolygons = new Set<PolyLine>();

  constructor(
    private http: Http,
    private toolBarStateService: ToolBarStateService,
    protected sheetOverlayService: SheetOverlayService,
    private editorService: EditorService,
    private contextMenuService: ContextMenusService,
    ) {
    super(sheetOverlayService);

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          _onEnter: () => {
            this.allPolygons.clear();
          },
          _onExit: () => {
            this._updateAllPolygons();
          },
          activate: 'active',
        },
        active: {
          deactivate: 'idle',
          edit: 'edit',
        },
        edit: {

        },
      }
    });
  }

  ngOnInit() {
  }

  onMouseDown(event: MouseEvent) {
    const p = this.mouseToSvg(event);
    if (this.states.state === 'idle') {
    }
  }

  onMouseUp(event: MouseEvent) {
    const p = this.mouseToSvg(event);

  }

  onMouseMove(event: MouseEvent) {
    const p = this.mouseToSvg(event);
  }

  private _updateAllPolygons() {
    this.allPolygons.clear();
    this.editorService.pcgts.page.musicRegions.forEach(
      mr => {
        mr.staffsEquivs.forEach(staff =>
          { this.allPolygons.add(staff.coords); }
        );
      }
    );
    this.editorService.pcgts.page.textRegions.forEach(
      tr => {
        this.allPolygons.add(tr.coords);
      }
    );
  }

  onPolylineAdded(event: {line: PolyLine, event: KeyboardEvent | MouseEvent}) {
    this.allPolygons.add(event.line);
    this.contextMenuService.regionTypeMenuExec(event.event);
  }

  onPolylineRemoved(polyline: PolyLine) {
    this.allPolygons.delete(polyline);
  }
}
