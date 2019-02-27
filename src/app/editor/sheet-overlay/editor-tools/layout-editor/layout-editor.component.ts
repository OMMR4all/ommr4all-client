import {Component, OnInit, ViewChild} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor.service';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {ContextMenusService} from '../../context-menus/context-menus.service';
import {RegionTypesContextMenu} from '../../context-menus/region-type-context-menu/region-type-context-menu.service';
import {
  PolylineCreatedEvent,
  PolylineEditorComponent,
  RequestChangedViewElementsFromPolyLine
} from '../../editors/polyline-editor/polyline-editor.component';
import {Region} from '../../../../data-types/page/region';
import {BlockType, EmptyRegionDefinition} from '../../../../data-types/page/definitions';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {Block} from '../../../../data-types/page/block';
import {PageLine} from '../../../../data-types/page/pageLine';
import {RegionTypeContextMenuComponent} from '../../context-menus/region-type-context-menu/region-type-context-menu.component';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {RequestChangedViewElements} from '../../../actions/changed-view-elements';
import {ViewSettings} from '../../views/view';

const machina: any = require('machina');

@Component({
  selector: '[app-layout-editor]',  // tslint:disable-line component-selector
  templateUrl: './layout-editor.component.html',
  styleUrls: ['./layout-editor.component.css']
})
export class LayoutEditorComponent extends EditorTool implements OnInit, RequestChangedViewElementsFromPolyLine {
  regionTypeMenu: RegionTypeContextMenuComponent;
  lineToBeChanged: PageLine = null;
  readonly LAYOUT = ActionType.Layout;

  @ViewChild(PolylineEditorComponent) polylineEditor: PolylineEditorComponent;
  get allPolygons() {
    const set = new Set<PolyLine>();
    if (this.state === 'idle') { return set; }
    this.editorService.pcgts.page.blocks.forEach(b => b.lines.forEach(l => {
      if (!l.coords || l.coords.length <= 2) {
        l.coords = l.AABB.toPolyline();
      }
      set.add(l.coords);
    }));
    return set;
  }
  currentMousePos = new Point(0, 0);
  private polyToAdd: PolylineCreatedEvent;
  contextParentRegion: Region;

  constructor(
    private toolBarStateService: ToolBarStateService,
    protected sheetOverlayService: SheetOverlayService,
    private editorService: EditorService,
    private contextMenuService: ContextMenusService,
    private actions: ActionsService,
    protected viewChanges: ViewChangesService,
    ) {
    super(sheetOverlayService, viewChanges,
      new ViewSettings(true, false, true, false, true),
      );

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
            this.polylineEditor.states.handle('activate');
          },
          activate: 'active',
          cancel: () => {
            this.polylineEditor.states.handle('cancel');
          }
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

  generate(polyLines: Array<PolyLine>): RequestChangedViewElements {
    const page = this.editorService.pcgts.page;
    return polyLines.map(pl => page.regionByCoords(pl));
  }

  onRegionTypeSelected(type: RegionTypesContextMenu) {
    if (type === RegionTypesContextMenu.Closed) {
      this.contextParentRegion = null;
      this.polyToAdd = null;
      return;
    }

    if (type === RegionTypesContextMenu.Delete) {
      this.actions.startAction(ActionType.LayoutDelete);
      this.actions.detachLine(this.lineToBeChanged);
      this.actions.removeFromSet(this.allPolygons, this.lineToBeChanged.coords);
      this._clean();
      this.actions.finishAction();
      this.states.handle('cancel');
      return;
    }

    if (this.lineToBeChanged) {
      // change line with context menu
      this.actions.startAction(ActionType.LayoutChangeType);
      const newBlock = this.actions.addNewBlock(this.lineToBeChanged.getBlock().page, type as number as BlockType);
      this.actions.attachLine(newBlock, this.lineToBeChanged);
      this.actions.finishAction();
      this.lineToBeChanged = null;
      return;
    }

    // new region context menu

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

  onPolyLineContextMenu(polyLine: PolyLine): void {
    this.lineToBeChanged = this.editorService.pcgts.page.regionByCoords(polyLine) as PageLine;
    this.contextMenuService.regionTypeMenu.hasContext = false;
    this.contextMenuService.regionTypeMenu.hasDelete = true;
    setTimeout(() => {
      this.contextMenuService.regionTypeMenuExec(this.currentMousePos);
    });
  }

  onPolylineAdded(event: PolylineCreatedEvent) {
    this.polyToAdd = event;
    this._findContextRegion(event);
    this.contextMenuService.regionTypeMenu.hasContext = this.contextParentRegion != null;
    this.contextMenuService.regionTypeMenu.hasDelete = false;
    setTimeout(() => {
      this.contextMenuService.regionTypeMenuExec(this.currentMousePos);
    });
  }

  onPolylineRemoved(polyline: PolyLine) {
    this.actions.removeFromSet(this.allPolygons, polyline);
    this.actions.removeCoords(polyline, this.editorService.pcgts.page);
    this._clean();
  }

  onPolylineUpdated(polyline: PolyLine) {
    const region = this.editorService.pcgts.page.regionByCoords(polyline);
    this.viewChanges.request([region]);
    this.actions.caller.pushChangedViewElement(region);
  }

  onPolylineJoin(polylines: Set<PolyLine>) {
    if (polylines.size <= 1) { return; }
    const regions: Array<Region> = [];
    polylines.forEach(p => regions.push(this.editorService.pcgts.page.regionByCoords(p)));
    const tls = regions.filter(r => r instanceof PageLine).map(r => r as PageLine);
    if (tls.length !== polylines.size) { return; }

    const tr = tls[0].getBlock();
    const type = tr.type;
    for (const tl of tls) {
      if (type !== tl.getBlock().type) { return; }
    }
    this.actions.startAction(ActionType.LayoutJoin);
    const newBlock = this.actions.addNewBlock(this.editorService.pcgts.page, type);
    tls.forEach(l => this.actions.attachLine(newBlock, l));
    this._clean();
    this.actions.finishAction();
  }

  private _clean() {
    this.actions.cleanPage(this.editorService.pcgts.page,
      EmptyRegionDefinition.HasDimension | EmptyRegionDefinition.HasLines | EmptyRegionDefinition.HasStaffLines  // tslint:disable-line
    );
  }

  receivePageMouseEvents(): boolean { return this.polylineEditor.receivePageMouseEvents(); }
  isRegionSelectable(region: Region): boolean { return true; }
  useMoveCursor() { return this.polylineEditor.useMoveCursor(); }
  useCrossHairCursor(): boolean { return this.polylineEditor.useCrossHairCursor(); }
}
