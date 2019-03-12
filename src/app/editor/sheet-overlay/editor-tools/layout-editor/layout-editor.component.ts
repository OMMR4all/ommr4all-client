import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorService} from '../../../editor.service';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {
  PolylineCreatedEvent,
  PolylineEditorComponent,
  RequestChangedViewElementsFromPolyLine
} from '../../editors/polyline-editor/polyline-editor.component';
import {Region} from '../../../../data-types/page/region';
import {BlockType, EmptyRegionDefinition} from '../../../../data-types/page/definitions';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {PageLine} from '../../../../data-types/page/pageLine';
import {RegionTypeContextMenuComponent} from '../../context-menus/region-type-context-menu/region-type-context-menu.component';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {RequestChangedViewElements} from '../../../actions/changed-view-elements';
import {ViewSettings} from '../../views/view';
import {Subscription} from 'rxjs';
import {Block} from '../../../../data-types/page/block';
import {arrayFromSet} from '../../../../utils/copy';
import {UserCommentHolder} from '../../../../data-types/page/userComment';

const machina: any = require('machina');

@Component({
  selector: '[app-layout-editor]',  // tslint:disable-line component-selector
  templateUrl: './layout-editor.component.html',
  styleUrls: ['./layout-editor.component.css']
})
export class LayoutEditorComponent extends EditorTool implements OnInit, OnDestroy, RequestChangedViewElementsFromPolyLine, AfterViewInit {
  private _subscriptions = new Subscription();
  @Input() regionTypeContextMenu: RegionTypeContextMenuComponent;
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
  contextParentRegion: Block = null;

  get selectedCommentHolder(): UserCommentHolder { return this.editorService.pcgts.page.regionByCoords(this.polylineEditor.selectedPolyLine); }

  constructor(
    private toolBarStateService: ToolBarStateService,
    protected sheetOverlayService: SheetOverlayService,
    private editorService: EditorService,
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
  }

  ngAfterViewInit() {
    this._subscriptions.add(this.regionTypeContextMenu.closed.subscribe(() => {
      this.polyToAdd = null;
      this.contextParentRegion = null;
    }));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  generate(polyLines: Array<PolyLine>): RequestChangedViewElements {
    const page = this.editorService.pcgts.page;
    return polyLines.map(pl => page.regionByCoords(pl));
  }

  onRegionTypeSelected(type: BlockType) {
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
    this._addRegion(this.polyToAdd.polyLine, type);
    this.contextParentRegion = null;
    this.polyToAdd = null;
    this.actions.finishAction();
  }

  private _addRegion(pl: PolyLine, type: BlockType) {
    const mr = this.actions.addNewBlock(this.editorService.pcgts.page, type);
    const staff = this.actions.addNewLine(mr);
    staff.coords = pl;
  }

  private _selectionToPageLines(polylines: Set<PolyLine> = null): PageLine[] {
    return arrayFromSet((polylines) ? polylines : this.polylineEditor.selectedPolyLines)
      .map(pl => this.editorService.pcgts.page.regionByCoords(pl))
      .filter(r => r instanceof PageLine).map(r => r as PageLine);
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
    const regions: Array<Block> = [];
    event.siblings.forEach(pl => {
      const r = this.editorService.pcgts.page.regionByCoords(pl).parentOfType(Block) as Block;

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

  private setContextMenuFunctions() {
    this.regionTypeContextMenu.addToSelectionAction = () => {
      const pl = this.polyToAdd.polyLine;
      if (!this.contextParentRegion) {
        return;
      }
      this.actions.startAction(ActionType.LayoutNewRegion);
      const contextParentBlock = this.contextParentRegion as Block;
      const l = this.actions.addNewLine(contextParentBlock);
      l.coords = pl;
      this.actions.finishAction();
      this.contextParentRegion = null;
      this.polyToAdd = null;
    };
    this.regionTypeContextMenu.typeSelectedAction = (type: BlockType, line: PageLine) => {
      this.onRegionTypeSelected(type);
    };
    this.regionTypeContextMenu.deleteAction = (line: PageLine) => {
      this.actions.startAction(ActionType.LayoutDelete);
      this.actions.detachLine(line);
      this.actions.removeFromSet(this.allPolygons, line.coords);
      this._clean();
      this.actions.finishAction();
      this.states.handle('cancel');
    };
    this.regionTypeContextMenu.joinAction = (line: PageLine, selection: PageLine[]) => {
      if (selection.indexOf(line) < 0) { selection.push(line); }
      this._joinPageLines(selection);
    };
  }

  onPolyLineContextMenu(polyLine: PolyLine): void {
    this.lineToBeChanged = this.editorService.pcgts.page.regionByCoords(polyLine) as PageLine;
    this.setContextMenuFunctions();
    this.regionTypeContextMenu.open(
      this.currentMousePos.x, this.currentMousePos.y,
      this.lineToBeChanged,
      this._selectionToPageLines(),
      false,
      true,
      this.polylineEditor.selectedPolyLines.size > 0,
    );
  }

  onPolylineAdded(event: PolylineCreatedEvent) {
    this.polyToAdd = event;
    this._findContextRegion(event);
    this.setContextMenuFunctions();
    this.regionTypeContextMenu.open(
      this.currentMousePos.x, this.currentMousePos.y,
      null,
      this._selectionToPageLines(),
      this.contextParentRegion != null,
      false,
    );
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

  private _joinPageLines(lines: PageLine[]) {
    if (lines.length <= 1) { return; }

    const tr = lines[0].getBlock();
    const type = tr.type;
    for (const tl of lines) {
      if (type !== tl.getBlock().type) { return; }
    }
    this.actions.startAction(ActionType.LayoutJoin);
    const newBlock = this.actions.addNewBlock(this.editorService.pcgts.page, type);
    lines.forEach(l => this.actions.attachLine(newBlock, l));
    this._clean();
    this.actions.finishAction();
  }

  onPolylineJoin(polylines: Set<PolyLine>) {
    if (polylines.size <= 1) { return; }
    const tls = this._selectionToPageLines(polylines);
    if (tls.length !== polylines.size) { return; }
    this._joinPageLines(tls);
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
