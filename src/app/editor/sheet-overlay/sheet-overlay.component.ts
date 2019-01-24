import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  ViewChild
} from '@angular/core';
import {LineEditorComponent} from './editor-tools/line-editor/line-editor.component';
import {StaffGrouperComponent} from './editor-tools/staff-grouper/staff-grouper.component';
import * as svgPanZoom from 'svg-pan-zoom';
import {PolyLine} from '../../geometry/geometry';
import {EditorService} from '../editor.service';
import {SymbolEditorComponent} from './editor-tools/symbol-editor/symbol-editor.component';
import {SheetOverlayService, SymbolConnection} from './sheet-overlay.service';
import {EditorTools, ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {TextRegionComponent} from './editor-tools/text-region/text-region.component';
import {DummyEditorTool, EditorTool} from './editor-tools/editor-tool';
import {BlockType, GraphicalConnectionType, SymbolType} from '../../data-types/page/definitions';
import {Note, Symbol} from '../../data-types/page/music-region/symbol';
import {Page} from '../../data-types/page/page';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {LayoutEditorComponent} from './editor-tools/layout-editor/layout-editor.component';
import {RegionTypeContextMenuComponent} from './context-menus/region-type-context-menu/region-type-context-menu.component';
import {ContextMenusService} from './context-menus/context-menus.service';
import {TextEditorComponent} from './editor-tools/text-editor/text-editor.component';
import {SyllableEditorComponent} from './editor-tools/syllable-editor/syllable-editor.component';
import {Connection, NeumeConnector, SyllableConnector} from '../../data-types/page/annotations';
import {SyllableEditorService} from './editor-tools/syllable-editor/syllable-editor.service';
import {ActionsService} from '../actions/actions.service';
import {PcGts} from '../../data-types/page/pcgts';
import {StaffSplitterComponent} from './editor-tools/staff-splitter/staff-splitter.component';
import {ActionType} from '../actions/action-types';
import {ServerStateService} from '../../server-state/server-state.service';
import {LayoutExtractConnectedComponentsComponent} from './editor-tools/layout-extract-connected-components/layout-extract-connected-components.component';
import {PageLine, LogicalConnection} from '../../data-types/page/pageLine';
import {Block} from '../../data-types/page/block';
import {LayoutLassoAreaComponent} from './editor-tools/layout-lasso-area/layout-lasso-area.component';

const palette: any = require('google-palette');

@Component({
  selector: 'app-sheet-overlay',
  templateUrl: './sheet-overlay.component.html',
  styleUrls: ['./sheet-overlay.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetOverlayComponent implements OnInit, AfterViewInit, AfterContentInit, AfterContentChecked, OnChanges {
  EditorTools = EditorTools;
  symbolType = SymbolType;
  BlockType = BlockType;

  @Input() pcgts: PcGts;

  readonly dummyEditor = new DummyEditorTool(this.sheetOverlayService);

  @ViewChild(RegionTypeContextMenuComponent) regionTypeContextMenu: RegionTypeContextMenuComponent;

  @ViewChild(LineEditorComponent) lineEditor: LineEditorComponent;
  @ViewChild(StaffGrouperComponent) staffGrouper: StaffGrouperComponent;
  @ViewChild(StaffSplitterComponent) staffSplitter: StaffSplitterComponent;
  @ViewChild(LayoutEditorComponent) layoutEditor: LayoutEditorComponent;
  @ViewChild(LayoutExtractConnectedComponentsComponent) layoutExtractConnectedComponents: LayoutExtractConnectedComponentsComponent;
  @ViewChild(LayoutLassoAreaComponent) layoutLassoArea: LayoutLassoAreaComponent;
  @ViewChild(TextRegionComponent) textRegion: TextRegionComponent;
  @ViewChild(SymbolEditorComponent) symbolEditor: SymbolEditorComponent;
  @ViewChild(TextEditorComponent) lyricsEditor: TextEditorComponent;
  @ViewChild(SyllableEditorComponent) syllableEditor: SyllableEditorComponent;
  @ViewChild('svgRoot') private svgRoot: ElementRef;
  private _editors = new Map<EditorTools, EditorTool>();

  private clickX: number;
  private clickY: number;
  private dragging = false;
  private minDragDistance = 10;
  private mouseDown = false;
  private mouseWillGrab = false;

  private lastNumberOfActions = 0;

  private _shadingPalette = palette('rainbow', 10);

  public static _isDragEvent(event: MouseEvent): boolean { return SheetOverlayService._isDragEvent(event); }

  shading(index: number) {
    return this._shadingPalette[index % 10];
  }

  getStaffs(): Array<PageLine> {
    let allML = [];
    this.page.musicRegions.forEach(mr => allML = [...allML, mr.musicLines]);
    return allML;
  }

  get sheetHeight() {
    return this.editorService.height;
  }

  get sheetWidth() {
    return this.editorService.width;
  }

  constructor(public toolBarStateService: ToolBarStateService,
              public editorService: EditorService,
              public sheetOverlayService: SheetOverlayService,
              public contextMenusService: ContextMenusService,
              public syllableEditorService: SyllableEditorService,
              private actions: ActionsService,
              public changeDetector: ChangeDetectorRef,
              private serverState: ServerStateService,
              ) {
  }

  ngOnChanges() {
  }

  ngAfterContentChecked() {
    if (this.page) { this.page._prepareRender(); }
  }

  ngAfterContentInit() {
  }

  ngOnInit() {
    this.sheetOverlayService.svgRoot = this.svgRoot;
    this.lineEditor.newLineAdded.subscribe(line => this.lineFinished(line));
    this.lineEditor.lineUpdated.subscribe(line => this.lineUpdated(line));
    this.lineEditor.lineDeleted.subscribe(line => this.lineDeleted(line));
    this.toolBarStateService.editorToolChanged.subscribe((v) => { this.onToolChanged(v); });
    this._editors.set(EditorTools.CreateStaffLines, this.lineEditor);
    this._editors.set(EditorTools.GroupStaffLines, this.staffGrouper);
    this._editors.set(EditorTools.SplitStaffLines, this.staffSplitter);
    this._editors.set(EditorTools.TextRegion, this.textRegion);
    this._editors.set(EditorTools.Symbol, this.symbolEditor);
    this._editors.set(EditorTools.Lyrics, this.lyricsEditor);
    this._editors.set(EditorTools.Layout, this.layoutEditor);
    this._editors.set(EditorTools.LayoutExtractConnectedComponents, this.layoutExtractConnectedComponents);
    this._editors.set(EditorTools.LayoutLassoArea, this.layoutLassoArea);
    this._editors.set(EditorTools.Syllables, this.syllableEditor);

    this.contextMenusService.regionTypeMenu = this.regionTypeContextMenu;
    this.editorService.pageStateObs.subscribe(page => {
      this.lastNumberOfActions = 0;
      if (this.currentEditorTool) {
        this.currentEditorTool.states.handle('activate');
      }
    });

    this.toolBarStateService.runClearFullPage.subscribe(() => this.clearFullPage());
    this.editorService.symbolDetectionFinished.subscribe((state) => this.changeDetector.markForCheck());
    this.editorService.staffDetectionFinished.subscribe((state) => this.changeDetector.markForCheck());
    this.editorService.layoutAnalysisFinished.subscribe(state => this.changeDetector.markForCheck());
  }

  ngAfterViewInit() {
    svgPanZoom('#svgRoot', {
      viewportSelector: '#svgRoot',
      eventsListenerElement: document.querySelector('#svgRoot'),
      beforePan: this.beforePan.bind(this),
      dblClickZoomEnabled: false
    });
    setTimeout(() => {
      this.sheetOverlayService.svgView = this.svgRoot.nativeElement.children[0];
    }, 0);
  }

  get showLayoutShading() {
    return this.toolBarStateService.currentEditorTool === EditorTools.Layout ||
      this.toolBarStateService.currentEditorTool === EditorTools.LayoutExtractConnectedComponents ||
      this.toolBarStateService.currentEditorTool === EditorTools.LayoutLassoArea;
  }
  get showStaffShading() {
    return this.toolBarStateService.currentEditorTool === EditorTools.CreateStaffLines ||
      this.toolBarStateService.currentEditorTool === EditorTools.GroupStaffLines;
  }

  get page(): Page { if (this.pcgts) { return this.pcgts.page; } else { return null; } }
  get tool(): EditorTools { return this.toolBarStateService.currentEditorTool; }

  get currentEditorTool(): EditorTool {
    if (this.sheetOverlayService.locked) {
      return this.dummyEditor;
    } else {
      return this._editors.get(this.tool);
    }
  }

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
    if (event.next === EditorTools.Lyrics) {
      // this.staffs.generateAutoLyricsPosition();
    }
    if (this._editors.get(event.next)) {
      this._editors.get(event.next).states.transition('idle');
      this._editors.get(event.next).states.handle('activate');
    }
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
    // this.actions.cleanPageMusicRegions(this.page, EmptyMusicRegionDefinition.HasStaffLines);
  }

  private clearFullPage() {
    this.actions.startAction(ActionType.CleanAll);
    this.actions.clearPage(this.page);
    this.actions.finishAction();
    this.changeDetector.markForCheck();
  }

  beforePan(n, o) {
    return {x: this.dragging, y: this.dragging};
  }

  onMouseMove(event: MouseEvent) {
    if (event.defaultPrevented) { return; }
    this.updateClosedStaffToMouse(event);
    if (this.mouseDown) {
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

  updateClosedStaffToMouse(event: MouseEvent) {
    const p = this.sheetOverlayService.mouseToSvg(event);
    const cmr = this.page.closestMusicRegionToPoint(p);
    if (cmr) {
      this.sheetOverlayService.closestStaffToMouse = cmr.closestMusicLineToPoint(p);
    } else {
      this.sheetOverlayService.closestStaffToMouse = null;
    }
    this.sheetOverlayService.closestRegionToMouse = this.page.closestRegionToPoint(p);
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  onMouseDown(event: MouseEvent) {
    if (event.defaultPrevented) { return; }

    if (SheetOverlayComponent._isDragEvent(event)) {
      this.clickX = event.clientX;
      this.clickY = event.clientY;
      this.dragging = false;
      this.mouseDown = true;
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
    if (event.defaultPrevented) { return; }
    if (this.mouseDown) {
      this.clickX = null;
      this.clickY = null;
      this.dragging = false;
      this.mouseDown = false;
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

  onLineContextMenu(event: (MouseEvent|KeyboardEvent), line: PageLine) {
    if (this.currentEditorTool && !this.dragging) {
      this.currentEditorTool.onLineContextMenu(event, line);
    }
  }

  onStaffAABBMouseDown(event: MouseEvent, staff: PageLine) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.onMouseDown(event);
    } else {
      this.currentEditorTool.onStaffAABBMouseDown(event, staff);
    }
  }

  onStaffLineMouseDown(event: MouseEvent, staffLine: StaffLine) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.onMouseDown(event);
    } else {
      if (this.tool === EditorTools.CreateStaffLines) {
        this.lineEditor.onLineMouseDown(event, staffLine.coords);
      } else if (this.tool === EditorTools.Symbol) {
        this.symbolEditor.onMouseDown(event);
      }
    }
  }

  onStaffLineMouseUp(event: MouseEvent, staffLine: StaffLine) {
    if (this.mouseDown) {
      this.onMouseUp(event);
    } else if (this.tool === EditorTools.CreateStaffLines) {
      // this.lineEditor.onLineMouseUp(event, staffLine.line);
    } else {
      this.onMouseUp(event);
    }
  }

  onTextLineMouseDown(event: MouseEvent, textLine: PageLine) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.onMouseDown(event);
    } else {
      this.currentEditorTool.onTextLineMouseDown(event, textLine);
    }
  }

  onTextLineMouseUp(event: MouseEvent, textLine: PageLine) {
    if (this.mouseDown) {
      this.onMouseUp(event);
    } else {
      this.currentEditorTool.onTextLineMouseUp(event, textLine);
    }
  }

  onTextLineMouseMove(event: MouseEvent, textLine: PageLine) {
    if (this.mouseDown) {
      this.onMouseMove(event);
    } else {
      this.currentEditorTool.onTextLineMouseMove(event, textLine);
    }
  }

  onTextRegionMouseDown(event: MouseEvent, textRegion: Block) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.onMouseDown(event);
    } else {
      this.currentEditorTool.onTextRegionMouseDown(event, textRegion);
    }
  }

  onTextRegionMouseUp(event: MouseEvent, textRegion: Block) {
    if (this.mouseDown) {
      this.onMouseUp(event);
    } else {
      this.currentEditorTool.onTextRegionMouseUp(event, textRegion);
    }
  }

  onTextRegionMouseMove(event: MouseEvent, textRegion: Block) {
    if (this.mouseDown) {
      this.onMouseMove(event);
    } else {
      this.currentEditorTool.onTextRegionMouseMove(event, textRegion);
    }
  }

  onMusicLineMouseDown(event: MouseEvent, textLine: PageLine) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.onMouseDown(event);
    } else {
      this.currentEditorTool.onMusicLineMouseDown(event, textLine);
    }
  }

  onMusicLineMouseUp(event: MouseEvent, textLine: PageLine) {
    if (this.mouseDown) {
      this.onMouseUp(event);
    } else {
      this.currentEditorTool.onMusicLineMouseUp(event, textLine);
    }
  }

  onMusicLineMouseMove(event: MouseEvent, textLine: PageLine) {
    if (this.mouseDown) {
      this.onMouseMove(event);
    } else {
      this.currentEditorTool.onMusicLineMouseMove(event, textLine);
    }
  }
  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.onMouseDown(event);
    } else {
      this.currentEditorTool.onSymbolMouseDown(event, symbol);
    }
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    if (this.mouseDown) {
      this.onMouseUp(event);
    } else {
      this.currentEditorTool.onSymbolMouseUp(event, symbol);
    }
  }

  onSymbolMouseMove(event: MouseEvent, symbol: Symbol) {
    if (this.mouseDown) {
      this.onMouseMove(event);
    } else {
      this.currentEditorTool.onSymbolMouseMove(event, symbol);
    }
  }

  onSyllableMouseUp(event: MouseEvent, connection: Connection, syllableConnector: SyllableConnector, neumeConnector: NeumeConnector) {
    if (this.mouseDown) {
      this.onMouseUp(event);
    } else {
      this.currentEditorTool.onSyllableMouseUp(event, connection, syllableConnector, neumeConnector);
    }
  }

  onLogicalConnectionMouseDown(event: MouseEvent, lc: LogicalConnection) {
    this.currentEditorTool.onLogicalConnectionMouseDown(event, lc);
  }

  onLogicalConnectionMouseUp(event: MouseEvent, lc: LogicalConnection) {
    if (this.mouseDown) { return; }
    this.currentEditorTool.onLogicalConnectionMouseUp(event, lc);
  }

  onKeypress(event: KeyboardEvent) {
  }

  @HostListener('document:keyup', ['$event'])
  onKeyup(event: KeyboardEvent) {
    if (event.code === 'AltLeft') {
      if (this.mouseDown) {
        this.mouseDown = false;
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
      event.preventDefault();
    } else if (event.code === 'AltLeft') {
      this.mouseWillGrab = true;
    } else {
      this.currentEditorTool.onKeydown(event);
    }
  }

  symbolConnection(i, symbol: Symbol): SymbolConnection {
    const connection = new SymbolConnection();
    if (symbol.symbol === SymbolType.Note) {
      const note = symbol as Note;
      if (note.graphicalConnection === GraphicalConnectionType.Looped) {
        connection.graphicalConnected = true;
      } else if (note.isNeumeStart) {
        connection.isNeumeStart = true;
        return connection;
      }

      connection.note = note.getPrevByType(Note) as Note;
    }
    return connection;
  }

  private _localCursorAction() { return this.mouseDown || this.mouseWillGrab; }

  isStaffLineSelectable(staffLine: StaffLine) { return !this._localCursorAction() && this.currentEditorTool.isStaffLineSelectable(staffLine); }
  isSymbolSelectable(symbol: Symbol): boolean { return !this._localCursorAction() && this.currentEditorTool.isSymbolSelectable(symbol); }
  isLogicalConnectionSelectable(lc: LogicalConnection): boolean { return !this._localCursorAction() && this.currentEditorTool.isLogicalConnectionSelectable(lc); }

  useCrossHairCursor(): boolean { return this.currentEditorTool.useCrossHairCursor(); }
  useMoveCursor() { return this.currentEditorTool.useMoveCursor(); }
  useGrabbingCursor() { return this.mouseDown; }
  useGrabCursor() { return this.mouseWillGrab; }
}
