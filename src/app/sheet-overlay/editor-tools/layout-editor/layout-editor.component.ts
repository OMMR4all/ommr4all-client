import {Component, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {Http} from '@angular/http';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor/editor.service';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {Point, PolyLine} from '../../../geometry/geometry';
import {ContextMenusService} from '../../context-menus/context-menus.service';
import {RegionTypesContextMenu} from '../../context-menus/region-type-context-menu/region-type-context-menu.service';
import {TextRegionType} from '../../../data-types/page/text-region';

const machina: any = require('machina');

@Component({
  selector: '[app-layout-editor]',  // tslint:disable-line component-selector
  templateUrl: './layout-editor.component.html',
  styleUrls: ['./layout-editor.component.css']
})
export class LayoutEditorComponent extends EditorTool implements OnInit {
  readonly allPolygons = new Set<PolyLine>();
  currentMousePos = new Point(0, 0);
  readonly polyToAdd = new Set<PolyLine>();

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
    this.contextMenuService.regionTypeMenu.triggered.subscribe(type => this.onRegionTypeSelected(type));
  }

  onRegionTypeSelected(type: RegionTypesContextMenu) {
    if (type === RegionTypesContextMenu.Music) {
      this.polyToAdd.forEach(pl => this._addMusicRegion(pl));
    } else if (type === RegionTypesContextMenu.Lyrics) {
      this.polyToAdd.forEach(pl => this._addLyricsRegion(pl));
    } else if (type === RegionTypesContextMenu.Text) {
      this.polyToAdd.forEach(pl => this._addTextRegion(pl, TextRegionType.Paragraph));
    }
    this.polyToAdd.clear();
  }

  private _addMusicRegion(pl: PolyLine) {
    const mr = this.editorService.pcgts.page.addNewMusicRegion();
    const staff = mr.getOrCreateStaffEquiv();
    staff.coords = pl;
    this.allPolygons.add(pl);
  }

  private _addTextRegion(pl: PolyLine, type: TextRegionType) {
    const tr = this.editorService.pcgts.page.addTextRegion(type);
    tr.coords = pl;
    this.allPolygons.add(pl);
  }

  private _addLyricsRegion(pl: PolyLine) {
    const tr = this.editorService.pcgts.page.addTextRegion(TextRegionType.Lyrics);
    const tl = tr.createTextLine();
    tl.coords = pl;
    this.allPolygons.add(pl);
  }

  onMouseDown(event: MouseEvent) {
  }

  onMouseUp(event: MouseEvent) {

  }

  onMouseMove(event: MouseEvent) {
    this.currentMousePos = new Point(event.clientX, event.clientY);
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

  onPolylineAdded(line: PolyLine) {
    this.polyToAdd.add(line);
    this.contextMenuService.regionTypeMenuExec(this.currentMousePos);
  }

  onPolylineRemoved(polyline: PolyLine) {
    this.editorService.pcgts.page.removeCoords(polyline);
    this.allPolygons.delete(polyline);
  }
}
