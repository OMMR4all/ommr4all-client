import {Component, OnInit} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {Http} from '@angular/http';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor/editor.service';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {Point, PolyLine} from '../../../geometry/geometry';
import {ContextMenusService} from '../../context-menus/context-menus.service';
import {RegionTypesContextMenu} from '../../context-menus/region-type-context-menu/region-type-context-menu.service';
import {TextRegion, TextRegionType} from '../../../data-types/page/text-region';
import {PolylineCreatedEvent} from '../../editors/polyline-editor/polyline-editor.component';
import {Region} from '../../../data-types/page/region';
import {MusicRegion} from '../../../data-types/page/music-region/music-region';
import {TextLine} from '../../../data-types/page/text-line';
import {EmptyMusicRegionDefinition, EmptyTextRegionDefinition} from '../../../data-types/page/definitions';
import {ActionsService} from '../../../editor/actions/actions.service';

const machina: any = require('machina');

@Component({
  selector: '[app-layout-editor]',  // tslint:disable-line component-selector
  templateUrl: './layout-editor.component.html',
  styleUrls: ['./layout-editor.component.css']
})
export class LayoutEditorComponent extends EditorTool implements OnInit {
  readonly allPolygons = new Set<PolyLine>();
  currentMousePos = new Point(0, 0);
  private polyToAdd: PolylineCreatedEvent;
  contextParentRegion: Region;

  constructor(
    private http: Http,
    private toolBarStateService: ToolBarStateService,
    protected sheetOverlayService: SheetOverlayService,
    private editorService: EditorService,
    private contextMenuService: ContextMenusService,
    private actions: ActionsService,
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
    if (type === RegionTypesContextMenu.Closed) {
      this.contextParentRegion = null;
      this.polyToAdd = null;
      return;
    }

    const pl = this.polyToAdd.polyLine;
    this.polyToAdd = null;

    if (type === RegionTypesContextMenu.AddToContext) {
      if (!this.contextParentRegion) { return; }
      if (this.contextParentRegion instanceof MusicRegion) {
        const mr = this.contextParentRegion as MusicRegion;
        const ml = mr.createMusicLine();
        ml.coords = pl;
      } else if (this.contextParentRegion instanceof TextRegion) {
        const tr = this.contextParentRegion as TextRegion;
        if (tr.type === TextRegionType.DropCapital) {
          this._addDropCapitalRegion(pl);
        } else {
          const tl = tr.createTextLine();
          tl.coords = pl;
        }

      } else {
        console.warn('Unknown region type of ', this.contextParentRegion);
        return;
      }

    } else if (type === RegionTypesContextMenu.Music) {
      this._addMusicRegion(pl);
    } else if (type === RegionTypesContextMenu.Lyrics) {
      this._addTextRegion(pl, TextRegionType.Lyrics);
    } else if (type === RegionTypesContextMenu.Text) {
      this._addTextRegion(pl, TextRegionType.Paragraph);
    } else if (type === RegionTypesContextMenu.DropCapital) {
      this._addDropCapitalRegion(pl);
    }
    this.contextParentRegion = null;
    this.allPolygons.add(pl);
  }

  private _addMusicRegion(pl: PolyLine) {
    const mr = this.editorService.pcgts.page.addNewMusicRegion();
    const staff = mr.createMusicLine();
    staff.coords = pl;
  }

  private _addDropCapitalRegion(pl: PolyLine) {
    const tr = this.editorService.pcgts.page.addTextRegion(TextRegionType.DropCapital);
    tr.coords = pl;
  }

  private _addTextRegion(pl: PolyLine, type: TextRegionType) {
    const tr = this.editorService.pcgts.page.addTextRegion(type);
    const tl = tr.createTextLine();
    tl.coords = pl;
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
        mr.musicLines.forEach(staff => {
          if (!staff.coords || staff.coords.points.length <= 2) {
            staff.coords = staff.AABB.toPolyline();
          }
          this.allPolygons.add(staff.coords);
        }
        );
      }
    );
    this.editorService.pcgts.page.textRegions.forEach(
      tr => {
        this.allPolygons.add(tr.coords);
        tr.textLines.forEach(tl => {
          this.allPolygons.add(tl.coords);
        });
      }
    );
  }

  private _findContextRegion(event: PolylineCreatedEvent) {
    this.contextParentRegion = null;
    if (event.siblings.size === 0) { return; }
    const regions: Array<Region> = [];
    event.siblings.forEach(pl => {
      const r = this.editorService.pcgts.page.regionByCoords(pl).root();

      if (r) { regions.push(r); }
    });

    if (regions.length === 0) { return; }

    const first = regions[0];
    for (const r of regions) {
      if (r !== first) {
        // different root regions
        return;
      }
    }

    this.contextParentRegion = regions[0];
  }

  onPolylineAdded(event: PolylineCreatedEvent) {
    this.polyToAdd = event;
    this._findContextRegion(event);
    this.contextMenuService.regionTypeMenu.hasContext = this.contextParentRegion != null;
    setTimeout(() => {
      this.contextMenuService.regionTypeMenuExec(this.currentMousePos);
    });
  }

  onPolylineRemoved(polyline: PolyLine) {
    this.editorService.pcgts.page.removeCoords(polyline);
    this.allPolygons.delete(polyline);
    this._clean();
  }

  onPolylineJoin(polylines: Set<PolyLine>) {
    if (polylines.size <= 1) { return; }
    const regions: Array<Region> = [];
    polylines.forEach(p => regions.push(this.editorService.pcgts.page.regionByCoords(p)));
    const tls = regions.filter(r => r instanceof TextLine).map(r => r as TextLine);
    if (tls.length !== polylines.size) { return; }

    const tr = tls[0].textRegion;
    const type = tr.type;
    for (const tl of tls) {
      if (type !== tl.textRegion.type) { return; }
    }
    const newTr = this.editorService.pcgts.page.addTextRegion(type);
    tls.forEach(tl => tl.attachToParent(newTr));
    this._clean();
    this._updateAllPolygons();
  }

  private _clean() {
    this.actions.cleanPageMusicRegions(this.editorService.pcgts.page,
      EmptyMusicRegionDefinition.HasDimension | EmptyMusicRegionDefinition.HasStaffLines);  // tslint:disable-line
    this.editorService.pcgts.page.cleanTextRegions(EmptyTextRegionDefinition.HasDimension | EmptyTextRegionDefinition.HasTextLines);  // tslint:disable-line
  }
}
