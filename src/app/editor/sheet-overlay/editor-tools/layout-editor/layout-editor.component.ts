import {Component, OnInit, ViewChild} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor.service';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {ContextMenusService} from '../../context-menus/context-menus.service';
import {RegionTypesContextMenu} from '../../context-menus/region-type-context-menu/region-type-context-menu.service';
import {PolylineCreatedEvent, PolylineEditorComponent} from '../../editors/polyline-editor/polyline-editor.component';
import {Region} from '../../../../data-types/page/region';
import {BlockType, EmptyMusicRegionDefinition, EmptyTextRegionDefinition} from '../../../../data-types/page/definitions';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {Block} from '../../../../data-types/page/block';
import {Line} from '../../../../data-types/page/line';

const machina: any = require('machina');

@Component({
  selector: '[app-layout-editor]',  // tslint:disable-line component-selector
  templateUrl: './layout-editor.component.html',
  styleUrls: ['./layout-editor.component.css']
})
export class LayoutEditorComponent extends EditorTool implements OnInit {
  readonly LAYOUT = ActionType.Layout;

  @ViewChild(PolylineEditorComponent) polylineEditor: PolylineEditorComponent;
  readonly allPolygons = new Set<PolyLine>();
  currentMousePos = new Point(0, 0);
  private polyToAdd: PolylineCreatedEvent;
  contextParentRegion: Region;

  constructor(
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
            if (this.polylineEditor) {
              this.polylineEditor.states.handle('cancel');
              this.polylineEditor.states.handle('deactivate');
              this.polylineEditor.states.transition('idle');
            }
          },
          _onExit: () => {
            this._updateAllPolygons();
            this.polylineEditor.states.handle('activate');
          },
          activate: 'active',
        },
        active: {
          deactivate: 'idle',
          edit: 'edit',
          cancel: () => {
            this.polylineEditor.states.handle('cancel');
          }
        },
      }
    });
  }

  ngOnInit() {
    this.contextMenuService.regionTypeMenu.triggered.subscribe(type => {
      if (this.state !== 'idle') { this.onRegionTypeSelected(type); }
    });
  }

  onRegionTypeSelected(type: RegionTypesContextMenu) {
    if (type === RegionTypesContextMenu.Closed) {
      this.contextParentRegion = null;
      this.polyToAdd = null;
      return;
    }

    this.actions.startAction(ActionType.LayoutNewRegion);
    (() => {
      const pl = this.polyToAdd.polyLine;
      this.polyToAdd = null;

      if (type === RegionTypesContextMenu.AddToContext) {
        if (!this.contextParentRegion) {
          return;
        }
        const contextParentBlock = this.contextParentRegion as Block;
        if (contextParentBlock.type === BlockType.Music) {
          const ml = this.actions.addNewLine(contextParentBlock);
          ml.coords = pl;
        } else {
          if (contextParentBlock.type === BlockType.DropCapital) {
            this._addRegion(pl, BlockType.DropCapital);
          } else {
            const tl = this.actions.addNewLine(contextParentBlock);
            tl.coords = pl;
          }
        }
      } else if (type === RegionTypesContextMenu.Music) {
        this._addRegion(pl, BlockType.Music);
      } else if (type === RegionTypesContextMenu.Lyrics) {
        this._addRegion(pl, BlockType.Lyrics);
      } else if (type === RegionTypesContextMenu.Text) {
        this._addRegion(pl, BlockType.Paragraph);
      } else if (type === RegionTypesContextMenu.DropCapital) {
        this._addRegion(pl, BlockType.DropCapital);
      }
      this.contextParentRegion = null;
      this.actions.addToSet(this.allPolygons, pl);
    })();
    this.actions.finishAction();
  }

  private _addRegion(pl: PolyLine, type: BlockType) {
    const mr = this.actions.addNewBlock(this.editorService.pcgts.page, type);
    const staff = this.actions.addNewLine(mr);
    staff.coords = pl;
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
    this.actions.removeFromSet(this.allPolygons, polyline);
    this.actions.removeCoords(polyline, this.editorService.pcgts.page);
    this._clean();
  }

  onPolylineJoin(polylines: Set<PolyLine>) {
    // TODO: UNDO REDO
    if (polylines.size <= 1) { return; }
    const regions: Array<Region> = [];
    polylines.forEach(p => regions.push(this.editorService.pcgts.page.regionByCoords(p)));
    const tls = regions.filter(r => r instanceof Line).map(r => r as Line);
    if (tls.length !== polylines.size) { return; }

    const tr = tls[0].getBlock();
    const type = tr.type;
    for (const tl of tls) {
      if (type !== tl.getBlock().type) { return; }
    }
    const newTr = this.editorService.pcgts.page.addTextRegion(type);
    tls.forEach(tl => tl.attachToParent(newTr));
    this._clean();
    this._updateAllPolygons();
  }

  private _clean() {
    this.actions.cleanPageMusicRegions(this.editorService.pcgts.page,
      EmptyMusicRegionDefinition.HasDimension | EmptyMusicRegionDefinition.HasStaffLines);  // tslint:disable-line
    this.actions.cleanPageTextRegions(this.editorService.pcgts.page,
      EmptyTextRegionDefinition.HasDimension | EmptyTextRegionDefinition.HasTextLines);  // tslint:disable-line
  }

  isRegionSelectable(region: Region): boolean { return true; }
  useMoveCursor() { return this.polylineEditor.useMoveCursor(); }
  useCrossHairCursor(): boolean { return this.polylineEditor.useCrossHairCursor(); }
}
