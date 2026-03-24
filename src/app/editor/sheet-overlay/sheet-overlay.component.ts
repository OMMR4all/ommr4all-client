import {
  SimpleChanges,
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
  NgZone, AfterViewChecked
} from '@angular/core';
import {LineEditorComponent} from './editor-tools/line-editor/line-editor.component';
import {StaffGrouperComponent} from './editor-tools/staff-grouper/staff-grouper.component';
import svgPanZoom from 'svg-pan-zoom';
import {Point, PolyLine} from '../../geometry/geometry';
import {EditorService, PredictedEvent} from '../editor.service';
import {SymbolEditorComponent} from './editor-tools/symbol-editor/symbol-editor.component';
import {SheetOverlayService} from './sheet-overlay.service';
import {EditorTools, ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {DummyEditorTool, EditorTool} from './editor-tools/editor-tool';
import {BlockType, EmptyRegionDefinition} from '../../data-types/page/definitions';
import {Page} from '../../data-types/page/page';
import {LayoutEditorComponent} from './editor-tools/layout-editor/layout-editor.component';
import {RegionTypeContextMenuComponent} from './context-menus/region-type-context-menu/region-type-context-menu.component';
import {TextEditorComponent} from './editor-tools/text-editor/text-editor.component';
import {SyllableEditorComponent} from './editor-tools/syllable-editor/syllable-editor.component';
import {ActionsService} from '../actions/actions.service';
import {PcGts} from '../../data-types/page/pcgts';
import {StaffSplitterComponent} from './editor-tools/staff-splitter/staff-splitter.component';
import {SymbolCopyAreaComponent} from './editor-tools/symbol-copy-area/symbol-copy-area.component';

import {ActionType} from '../actions/action-types';
import {ServerStateService} from '../../server-state/server-state.service';
import {LayoutExtractConnectedComponentsComponent} from './editor-tools/layout-extract-connected-components/layout-extract-connected-components.component';
import {LayoutLassoAreaComponent} from './editor-tools/layout-lasso-area/layout-lasso-area.component';
import {ViewChangesService} from '../actions/view-changes.service';
import {ChangedView} from '../actions/changed-view-elements';
import {ViewComponent} from './editor-tools/view/view.component';
import {Subscription} from 'rxjs';
import {Block} from '../../data-types/page/block';
import {TextEditorOverlayComponent} from './editor-tools/text-editor/text-editor-overlay/text-editor-overlay.component';
import {ReadingOrderContextMenuComponent} from './context-menus/reading-order-context-menu/reading-order-context-menu.component';
import {SymbolContextMenuComponent} from './context-menus/symbol-context-menu/symbol-context-menu.component';
import {ShortcutService} from '../shortcut-overlay/shortcut.service';
import {take} from 'rxjs/operators';
import {BookDocumentsService} from '../../book-documents.service';
import {LayoutLineSplitterComponent} from "./editor-tools/layout-line-splitter/layout-line-splitter.component";
import {LayoutLineMergerComponent} from "./editor-tools/layout-line-merger/layout-line-merger.component";

interface CachedTextBlock {
  block: Block;
  readingOrderPolyline: PolyLine;
}
@Component({
    selector: 'app-sheet-overlay',
    templateUrl: './sheet-overlay.component.html',
    styleUrls: ['./sheet-overlay.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SheetOverlayComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, AfterContentChecked, OnChanges, AfterViewChecked {
  toolBarStateService = inject(ToolBarStateService);
  editorService = inject(EditorService);
  sheetOverlayService = inject(SheetOverlayService);
  private actions = inject(ActionsService);
  changeDetector = inject(ChangeDetectorRef);
  private serverState = inject(ServerStateService);
  private viewChanges = inject(ViewChangesService);
  private hotkeys = inject(ShortcutService);
  documentService = inject(BookDocumentsService);
  private ngZone = inject(NgZone);
  private lockSub: Subscription;
  private _subscriptions = new Subscription();
  EditorTools = EditorTools;
  BlockType = BlockType;
  EditorTool = EditorTool;

  @Input() pcgts: PcGts;

  readonly dummyEditor = new DummyEditorTool(this.sheetOverlayService, this.viewChanges, this.changeDetector);

  @ViewChild(RegionTypeContextMenuComponent, {static: true}) regionTypeContextMenu: RegionTypeContextMenuComponent;
  @ViewChild(ReadingOrderContextMenuComponent, {static: true}) readingOrderContextMenu: ReadingOrderContextMenuComponent;
  @ViewChild(SymbolContextMenuComponent, {static: true}) symbolContextMenu: SymbolContextMenuComponent;
  @ViewChild(TextEditorOverlayComponent, {static: true}) textEditorOverlay: TextEditorOverlayComponent;

  @ViewChild(ViewComponent, {static: true}) viewTool: ViewComponent;
  @ViewChild(LineEditorComponent, {static: true}) lineEditor: LineEditorComponent;
  @ViewChild(StaffGrouperComponent, {static: true}) staffGrouper: StaffGrouperComponent;
  @ViewChild(StaffSplitterComponent, {static: true}) staffSplitter: StaffSplitterComponent;

  @ViewChild(LayoutEditorComponent, {static: true}) layoutEditor: LayoutEditorComponent;
  @ViewChild(LayoutExtractConnectedComponentsComponent, {static: true}) layoutExtractConnectedComponents: LayoutExtractConnectedComponentsComponent;
  @ViewChild(LayoutLassoAreaComponent, {static: true}) layoutLassoArea: LayoutLassoAreaComponent;
  @ViewChild(LayoutLineSplitterComponent, {static: true}) layoutSplitTextLines: LayoutLineSplitterComponent;
  @ViewChild(LayoutLineMergerComponent, {static: true}) layoutMergeTextLines: LayoutLineMergerComponent;

  @ViewChild(SymbolEditorComponent, {static: true}) symbolEditor: SymbolEditorComponent;
  @ViewChild(SymbolCopyAreaComponent, {static: true}) symbolCopyArea: SymbolCopyAreaComponent;

  @ViewChild(TextEditorComponent, {static: true}) lyricsEditor: TextEditorComponent;
  @ViewChild(SyllableEditorComponent, {static: true}) syllableEditor: SyllableEditorComponent;


  @ViewChild('svgRoot', {static: true}) private _svgRoot: ElementRef;

  private _editors = new Map<EditorTools, EditorTool>();

  private clickX: number;
  private clickY: number;
  private _mouseInArea = false;
  get mouseInArea() { return this._mouseInArea; }
  private dragging = false;
  private minDragDistance = 10;
  private grabDown = false;
  private mouseDown = false;
  private mouseWillGrab = false;
  private lastMouseMoveTime = 0;
  private lastNumberOfActions = 0;
  public cachedTextBlocks: CachedTextBlock[] = [];
  public cachedMusicBlocks: Block[] = [];
  public cachedSvgZoom: number = 1;
  public cachedSvgPan: {x: number, y: number} = {x: 0, y: 0};
  public cachedWidth: number = 0;
  public cachedReadingOrderCenterPoints: PolyLine;
  // SVG ZOOM PAN
  private _zoomUpdateTrigger: any = null;
  private _svgZoomPan: any;
  get svgRoot() { return this._svgRoot; }
  get svgZoom() { return (this._svgZoomPan) ?  this._svgZoomPan.getSizes().realZoom : 1; }
  get svgPan() { return this._svgZoomPan ? this._svgZoomPan.getPan() : {x: 0, y: 0}; }
  get width() { return this._svgZoomPan ? this._svgZoomPan.getSizes().width : this.sheetOverlayService.editorService.pcgts.page.imageWidth; }
  @Output() svgZoomPanChanged = new EventEmitter<{zoom: number, pan: {x: number, y: number}}>();

  @Output() sheetOverlayComponentLoaded = new EventEmitter<EditorTool>();

  public static _isDragEvent(event: MouseEvent): boolean { return SheetOverlayService._isDragEvent(event); }
  get currentEditorTool(): EditorTool {
    if (this.sheetOverlayService.locked) {
      return this.dummyEditor;
    } else {
      return this._editors.get(this.tool) || this.dummyEditor;
    }
  }
  public updateBlocksCache() {
    if (!this.page) {
      this.cachedTextBlocks = [];
      this.cachedMusicBlocks = [];
      this.cachedReadingOrderCenterPoints = null;
      return;
    }
    this.cachedReadingOrderCenterPoints = this.page.readingOrder.centerPoints;
    this.cachedTextBlocks = this.page.blocks
      .filter(b => b.type === BlockType.Paragraph)
      .map(block => ({
        block: block,
        readingOrderPolyline: block.childCentersAsPolyline()
      }));

    this.cachedMusicBlocks = this.page.blocks.filter(b => b.type === BlockType.Music);
  }

  constructor() {
    const hotkeys = this.hotkeys;

    this.sheetOverlayService._sheetOverlayComponent = this;

    // Register Shortcuts to the CheatSheet Viewer
    hotkeys.addShortcut({ keys: hotkeys.symbols().control2 + ' + S', description: 'Save state of Page', group: EditorTools.General });
    hotkeys.addShortcut({ keys: hotkeys.symbols().mouse3, description: 'Grab mouse to move view of document', group: EditorTools.General });
       hotkeys.addShortcut({ keys: hotkeys.symbols().lalt + ' + ' + hotkeys.symbols().mouse1, description: 'Grab mouse to move view of document', group: EditorTools.General });

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pcgts']) {
      this.updateBlocksCache();
    }
  }

  ngAfterContentChecked() {
  }
  ngAfterViewChecked() {
    //console.log('Angular Tick: SheetOverlay');
  }
  ngAfterContentInit() {
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngOnInit() {
    this._subscriptions.add(this.svgZoomPanChanged.subscribe((c) => {
      this.sheetOverlayService.svgPanZoom.zoom = c.zoom;
      this.sheetOverlayService.svgPanZoom.pan = new Point(c.pan.x, c.pan.y);
    }));
    this._subscriptions.add(this.lineEditor.newLineAdded.subscribe(line => this.lineFinished(line)));
    this._subscriptions.add(this.lineEditor.lineUpdated.subscribe(line => this.lineUpdated(line)));
    this._subscriptions.add(this.lineEditor.lineDeleted.subscribe(line => this.lineDeleted(line)));
    this._subscriptions.add(this.toolBarStateService.editorToolChanged.subscribe((v) => {
      this.onToolChanged(v);
    }));
    this._editors.set(EditorTools.View, this.viewTool);
    this._editors.set(EditorTools.CreateStaffLines, this.lineEditor);
    this._editors.set(EditorTools.GroupStaffLines, this.staffGrouper);
    this._editors.set(EditorTools.SplitStaffLines, this.staffSplitter);
    this._editors.set(EditorTools.Symbol, this.symbolEditor);
    this._editors.set(EditorTools.SymbolCopyArea, this.symbolCopyArea);

    this._editors.set(EditorTools.Lyrics, this.lyricsEditor);
    this._editors.set(EditorTools.Layout, this.layoutEditor);
    this._editors.set(EditorTools.LayoutExtractConnectedComponents, this.layoutExtractConnectedComponents);
    this._editors.set(EditorTools.LayoutLassoArea, this.layoutLassoArea);
    this._editors.set(EditorTools.LayoutSplitTextLines, this.layoutSplitTextLines);
    this._editors.set(EditorTools.LayoutMergeTextLines, this.layoutMergeTextLines);

    this._editors.set(EditorTools.Syllables, this.syllableEditor);

    this._subscriptions.add(this.editorService.pageStateObs.subscribe(page => {
      this.lastNumberOfActions = 0;
      this.updateBlocksCache();

      if (this.currentEditorTool) {
        this.currentEditorTool.states.handle('activate');
      }
      this.changeDetector.markForCheck();
    }));

    this._subscriptions.add(this.toolBarStateService.runClearFullPage.subscribe(() => this.clearFullPage()));
    this._subscriptions.add(this.editorService.predicted.subscribe((e: PredictedEvent) => {
      console.log('LOOP SUSPECT: predicted fired!');
      this.changeDetector.markForCheck()}));
    this._subscriptions.add(this.viewChanges.changed.subscribe(() => {
      this.updateBlocksCache();
      this.changeDetector.markForCheck();
    }));

    this.sheetOverlayComponentLoaded.emit(this.currentEditorTool);
  }


  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {

      this._svgZoomPan = svgPanZoom('#svgRoot', {
        viewportSelector: '#svgRoot',
        eventsListenerElement: document.querySelector('#svgRoot'),
        beforePan: this.beforePan.bind(this),
        dblClickZoomEnabled: false,
        maxZoom: 1000,
        refreshRate: 'auto',
        preventMouseEventsDefault: true,
        onZoom: (zoom) => this.ngZone.run(() => this.onZoom(zoom)),
        onPan: (pan) => this.ngZone.run(() => this.onPan(pan))
      });

    });
    this.updatePanZoomCache();
    this.svgZoomPanChanged.emit({zoom: this.cachedSvgZoom, pan: this.cachedSvgPan});
  }

  get page(): Page { if (this.pcgts) { return this.pcgts.page; } else { return null; } }


  get tool(): EditorTools { return this.toolBarStateService.currentEditorTool; }



  toIdle() {
    this.currentEditorTool.states.handle('cancel');
    this._editors.forEach((v, k) => v.states.handle('idle'));
    this._editors.forEach((v, k) => v.states.transition('idle'));
    this.currentEditorTool.states.handle('activate');
  }

  onToolChanged(event: {prev: EditorTools, next: EditorTools}) {
    if (this._editors.get(event.prev)) {
      this._editors.get(event.prev).states.transition('idle');
    }
    if (this._editors.get(event.next)) {
      this._editors.get(event.next).states.transition('idle');
      this._editors.get(event.next).states.handle('activate');
    }
    this.changeDetector.markForCheck();
  }

  lineUpdated(line: PolyLine) {
    const staffLine = this.page.staffLineByCoords(line);
    this.actions.sortStaffLines(staffLine.staff.staffLines);
    this.actions.updateAverageStaffLineDistance(staffLine.staff);
    staffLine.staff.symbols.forEach(s => this.actions.updateSymbolSnappedCoord(s));
  }

  lineFinished(line: PolyLine) {
    // get closest staff, check if line is in avg staff line distance, else create a new staff with that line
    const closestStaff = this.sheetOverlayService.closestStaffToMouse;
    if (closestStaff === null) {
      this.actions.addNewStaffLine(this.actions.addNewLine(this.actions.addNewBlock(this.page, BlockType.Music)), line);
    } else {
      const y = line.averageY();
      if (closestStaff.staffLines.length === 1 ||
        (y < closestStaff.AABB.bl().y + closestStaff.avgStaffLineDistance * 2 &&
        y > closestStaff.AABB.tl().y - closestStaff.avgStaffLineDistance * 2)) {
        this.actions.addNewStaffLine(closestStaff, line);
      } else {
        this.actions.addNewStaffLine(this.actions.addNewLine(this.actions.addNewBlock(this.page, BlockType.Music)), line);
      }
    }
  }

  lineDeleted(line: PolyLine) {
    for (const region of this.page.musicRegions) {
      for (const staff of region.musicLines) {
        const sl = staff.staffLineByCoords(line);
        if (sl) {
          this.actions.deleteStaffLine(sl);
          break;
        }
      }
    }
    this.actions.cleanPage(this.page, EmptyRegionDefinition.HasStaffLines | EmptyRegionDefinition.HasLines, new Set<BlockType>([BlockType.Music]));
  }

  private clearFullPage() {
    if (this.currentEditorTool) { this.currentEditorTool.states.handle('cancel'); }
    this.actions.startAction(ActionType.CleanAll);
    this.actions.clearPage(this.page);
    this.actions.finishAction();
    this.changeDetector.markForCheck();
  }

  beforePan(n, o) { return {x: this.dragging, y: this.dragging}; }
  private updatePanZoomCache() {
    if (this._svgZoomPan) {
      const sizes = this._svgZoomPan.getSizes();
      this.cachedSvgZoom = sizes.realZoom;
      this.cachedSvgPan = this._svgZoomPan.getPan(); // Stored once!
      this.cachedWidth = sizes.width;
    }
  }

  onPan(pan) {
    this.updatePanZoomCache();
    this.svgZoomPanChanged.emit({zoom: this.cachedSvgZoom, pan: this.cachedSvgPan});
    this.changeDetector.markForCheck();
  }

  onZoom(zoom) {
    this.updatePanZoomCache();
    if (this._zoomUpdateTrigger) {
      clearTimeout(this._zoomUpdateTrigger);
    }
    this._zoomUpdateTrigger = setTimeout(() => {
      const changes = new ChangedView();
      this.page.blocks.forEach(b => b.lines.forEach(l => changes.add(l)));
      this.viewChanges.handle(changes);
    }, 500);
    this.svgZoomPanChanged.emit({zoom: this.cachedSvgZoom, pan: this.cachedSvgPan});
    this.changeDetector.markForCheck();
  }


  onMouseMove(event: MouseEvent) {
    if (event.defaultPrevented) { return; }
    const now = Date.now();
    if (now - this.lastMouseMoveTime > 33) {
      this.updateClosedStaffToMouse(event);
      this.lastMouseMoveTime = now;
    }
    if (this.grabDown) {
      const dx = event.clientX - this.clickX;
      const dy = event.clientY - this.clickY;
      if (dx * dx + dy * dy > this.minDragDistance * this.minDragDistance) {
        this.dragging = true;
      }
    } else {
      if (this.currentEditorTool) {
        this.currentEditorTool.onMouseMove(event);
      }
    }
    if (!this.sheetOverlayService.locked) {
      this.sheetOverlayService.mouseMove.emit(event);
    }
  }

  onMouseEnter(event: MouseEvent) {
    this._mouseInArea = true;
    if (event.defaultPrevented) { return; }
    if (this.grabDown) {
    } else {
      this.currentEditorTool.onMouseEnter(event);
    }
  }

  onMouseLeave(event: MouseEvent) {
    this._mouseInArea = false;
    if (event.defaultPrevented) { return; }
    if (this.grabDown) {
    } else {
      this.currentEditorTool.onMouseLeave(event);
    }
  }

  updateClosedStaffToMouse(event: MouseEvent) {
    if (!this.page) return;
    const p = this.sheetOverlayService.mouseToSvg(event);

    const oldStaff = this.sheetOverlayService.closestStaffToMouse;
    const oldRegion = this.sheetOverlayService.closestRegionToMouse;
    const oldLyricLine = this.sheetOverlayService.closestLyricLineToMouse;

    const cmr = this.page.closestMusicRegionToPoint(p);
    const newStaff = cmr ? cmr.closestMusicLineToPoint(p) : null;
    const newRegion = this.page.closestRegionToPoint(p);
    const newLyricLine = (newRegion) ? (newRegion as Block).closestLineToPointOfType(p) : null;

    const lr = this.page.closestLyricRegionToPoint(p);
    const newClosestLyricLine = lr ? (lr as Block).closestLineToPointOfType(p) : null;

    this.sheetOverlayService.closestStaffToMouse = newStaff;
    this.sheetOverlayService.closestRegionToMouse = newRegion;
    this.sheetOverlayService.closestLineToMouse = newLyricLine;
    this.sheetOverlayService.closestLyricLineToMouse = newClosestLyricLine;

    if (oldStaff !== newStaff || oldRegion !== newRegion || oldLyricLine !== newClosestLyricLine) {
      const changes = [oldStaff, oldRegion, newStaff, newRegion].filter(item => item != null);
      if (changes.length > 0) {
        this.viewChanges.request(changes);
      }
    }
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  onMouseDown(event: MouseEvent) {
    this.mouseDown = true;
    if (event.defaultPrevented) { return; }

    if (SheetOverlayComponent._isDragEvent(event)) {
      this.clickX = event.clientX;
      this.clickY = event.clientY;
      this.dragging = false;
      this.grabDown = true;
      event.preventDefault();
    } else {
      if (this.currentEditorTool) {
        this.currentEditorTool.onMouseDown(event);
        if (event.defaultPrevented) {
          return;
        }
      }
    }
    if (!this.sheetOverlayService.locked) {
      this.sheetOverlayService.mouseDown.emit(event);
    }
  }

  onMouseUp(event: MouseEvent) {
    this.mouseDown = false;
    if (event.defaultPrevented) { return; }
    if (this.grabDown) {
      this.clickX = null;
      this.clickY = null;
      this.dragging = false;
      this.grabDown = false;
      event.preventDefault();
      return;
    } else {
      if (this.currentEditorTool && !this.dragging) {
        this.currentEditorTool.onMouseUp(event);
      }
    }
    if (!this.sheetOverlayService.locked) {
      this.sheetOverlayService.mouseUp.emit(event);
    }
  }

  onKeypress(event: KeyboardEvent) {
  }

  @HostListener('document:keyup', ['$event'])
  onKeyup(event: KeyboardEvent) {
    if (event.code === 'AltLeft') {
      if (this.grabDown) {
        this.grabDown = false;
        this.dragging = false;
      }
      this.mouseWillGrab = false;
    } else {
      this.currentEditorTool.onKeyup(event);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.code === 'KeyS' && event.ctrlKey) {
      this.editorService.save();
      this.documentService.updateState();
      event.preventDefault();
    } else if (event.code === 'AltLeft') {
      this.mouseWillGrab = true;
    } else if (event.shiftKey && event.code === 'Digit1') {
      this.toolBarStateService.currentEditorTool = EditorTools.Lyrics;
    } else if (event.shiftKey && event.code === 'Digit2') {
      this.toolBarStateService.currentEditorTool = EditorTools.Syllables;
    } else if (event.shiftKey && event.code === 'Digit3') {
      this.toolBarStateService.currentEditorTool = EditorTools.Symbol;
    }else {
      this.currentEditorTool.onKeydown(event);
    }
  }

  private _localCursorAction() { return this.grabDown || this.mouseWillGrab; }

  receivePageMouseEvents() { return !this._localCursorAction() && this.currentEditorTool.receivePageMouseEvents(); }

  useCrossHairCursor(): boolean { return this.currentEditorTool.useCrossHairCursor(); }
  useMoveCursor() { return this.currentEditorTool.useMoveCursor(); }
  useGrabbingCursor() { return this.grabDown; }
  useGrabCursor() { return this.mouseWillGrab; }
  useWaitCursor() { return this.currentEditorTool.useWaitCursor(); }

  mouseCaptured() { return this.mouseDown || this.currentEditorTool.isMouseCaptured(); }


}
