import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {LineEditorComponent} from '../line-editor/line-editor.component';
import {StaffGrouperComponent} from '../staff-grouper/staff-grouper.component';
import * as svgPanZoom from 'svg-pan-zoom';
import {Point, PolyLine} from '../geometry/geometry';
import {EditorService} from '../editor/editor.service';
import {SymbolEditorComponent} from '../symbol-editor/symbol-editor.component';
import {SheetOverlayService} from './sheet-overlay.service';
import {LyricsEditorComponent} from '../lyrics-editor/lyrics-editor.component';
import {LyricsContainer} from '../musical-symbols/lyrics';
import {EditorTools, ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {TextRegionComponent} from './editor-tools/text-region/text-region.component';
import {EditorTool} from './editor-tools/editor-tool';
import {GraphicalConnectionType, SymbolType} from '../data-types/page/definitions';
import {Note, Symbol} from '../data-types/page/music-region/symbol';
import {StaffEquiv} from '../data-types/page/music-region/staff-equiv';
import {Page} from '../data-types/page/page';
import {MusicLine} from '../data-types/page/music-region/staff-line';
import {LayoutEditorComponent} from './editor-tools/layout-editor/layout-editor.component';
import {RegionTypeContextMenuComponent} from './context-menus/region-type-context-menu/region-type-context-menu.component';
import {ContextMenusService} from './context-menus/context-menus.service';
import {TextRegionType} from '../data-types/page/text-region';

const palette: any = require('google-palette');

@Component({
  selector: 'app-sheet-overlay',
  templateUrl: './sheet-overlay.component.html',
  styleUrls: ['./sheet-overlay.component.css']
})
export class SheetOverlayComponent implements OnInit, AfterViewInit {
  EditorTools = EditorTools;
  symbolType = SymbolType;
  TextRegionType = TextRegionType;

  @ViewChild(RegionTypeContextMenuComponent) regionTypeContextMenu: RegionTypeContextMenuComponent;

  @ViewChild(LineEditorComponent) lineEditor: LineEditorComponent;
  @ViewChild(StaffGrouperComponent) staffGrouper: StaffGrouperComponent;
  @ViewChild(LayoutEditorComponent) layoutEditor: LayoutEditorComponent;
  @ViewChild(TextRegionComponent) textRegion: TextRegionComponent;
  @ViewChild(SymbolEditorComponent) symbolEditor: SymbolEditorComponent;
  @ViewChild(LyricsEditorComponent) lyricsEditor: LyricsEditorComponent;
  @ViewChild('svgRoot') private svgRoot: ElementRef;
  private _editors = {};

  private clickX: number;
  private clickY: number;
  private dragging = false;
  private minDragDistance = 10;
  private mouseDown = false;

  private _shadingPalette = palette('rainbow', 10);

  private static _isDragEvent(event: MouseEvent): boolean {
    return event.button === 1 || (event.button === 0 && event.altKey);
  }

  shading(index: number) {
    return this._shadingPalette[index % 10];
  }

  getStaffs(): Array<StaffEquiv> {
    return this.editorService.pcgts.page.musicRegions.map(mr => mr.getOrCreateStaffEquiv());
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
              ) {
  }


  ngOnInit() {
    this.sheetOverlayService.svgRoot = this.svgRoot;
    this.lineEditor.setCallbacks(
      this.lineFinished.bind(this),
      this.lineDeleted.bind(this),
      this.lineUpdated.bind(this)
    );
    this.toolBarStateService.editorToolChanged.subscribe((v) => { this.onToolChanged(v); });
    this._editors[EditorTools.CreateStaffLines] = this.lineEditor;
    this._editors[EditorTools.GroupStaffLines] = this.staffGrouper;
    this._editors[EditorTools.TextRegion] = this.textRegion;
    this._editors[EditorTools.Symbol] = this.symbolEditor;
    this._editors[EditorTools.Lyrics] = this.lyricsEditor;
    this._editors[EditorTools.Layout] = this.layoutEditor;

    this.contextMenusService.regionTypeMenu = this.regionTypeContextMenu;
    this.editorService.pcgtsObservable.subscribe(page => {
        if (this.currentEditorTool) {
          this.currentEditorTool.states.handle('activate');
        }
      }
    );
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
    return this.toolBarStateService.currentEditorTool === EditorTools.Layout;
  }
  get showStaffShading() {
    return this.toolBarStateService.currentEditorTool === EditorTools.CreateStaffLines ||
      this.toolBarStateService.currentEditorTool === EditorTools.GroupStaffLines;
  }

  get page(): Page {
    return this.editorService.pcgts.page;
  }
  get tool(): EditorTools {
    return this.toolBarStateService.currentEditorTool;
  }

  get currentEditorTool(): EditorTool {
    return this._editors[this.tool];
  }

  onToolChanged(event: {prev: EditorTools, next: EditorTools}) {
    if (this._editors[event.prev]) {
      this._editors[event.prev].states.transition('idle');
    }
    if (event.next === EditorTools.Lyrics) {
      // this.staffs.generateAutoLyricsPosition();
    }
    if (this._editors[event.next]) {
      this._editors[event.next].states.transition('idle');
      this._editors[event.next].states.handle('activate');
    }
  }

  lineUpdated(line: PolyLine) {
    const staff = this.getStaffs().find(s => s.hasStaffLineByCoords(line));
    if (staff) {
      staff.update();
    }
  }

  lineFinished(line: PolyLine) {
    // get closest staff, check if line is in avg staff line distance, else create a new staff with that line
    const closestStaff = this.sheetOverlayService.closestStaffToMouse;
    if (closestStaff === null) {
      new MusicLine(this.page.addNewMusicRegion().getOrCreateStaffEquiv(), line);  // tslint:disable-line no-unused-expression max-line-length
    } else {
      const y = line.averageY();
      if (closestStaff.staffLines.length === 1 ||
        (y < closestStaff.AABB.bl().y + closestStaff.avgStaffLineDistance * 2 &&
        y > closestStaff.AABB.tl().y - closestStaff.avgStaffLineDistance * 2)) {
        new MusicLine(closestStaff, line);  // tslint:disable-line no-unused-expression
      } else {
        new MusicLine(this.page.addNewMusicRegion().getOrCreateStaffEquiv(), line); // tslint:disable-line no-unused-expression max-line-length
      }
    }
  }

  lineDeleted(line: PolyLine) {
    for (const staff of this.getStaffs()) {
      const sl = staff.staffLineByCoords(line);
      if (sl) { sl.detach(); break; }
    }
  }

  beforePan(n, o) {
    return {x: this.dragging, y: this.dragging};
  }

  onMouseMove(event: MouseEvent) {
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
    this.sheetOverlayService.mouseMove.emit(event);
  }

  updateClosedStaffToMouse(event: MouseEvent) {
    const p = this.sheetOverlayService.mouseToSvg(event);
    this.sheetOverlayService.closestStaffToMouse = this.page.closestStaffEquivToPoint(p);
  }


  onMouseDown(event: MouseEvent) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.clickX = event.clientX;
      this.clickY = event.clientY;
      this.dragging = false;
      this.mouseDown = true;
      event.preventDefault();
    } else {
      if (this.currentEditorTool) {
        if (this.currentEditorTool.onMouseDown(event)) {
          return;
        }
      }
    }
    this.sheetOverlayService.mouseDown.emit(event);
  }

  onMouseUp(event: MouseEvent) {
    if (this.mouseDown) {
      this.clickX = null;
      this.clickY = null;
      this.dragging = false;
      this.mouseDown = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    } else {
      if (this.currentEditorTool && !this.dragging) {
        this.currentEditorTool.onMouseUp(event);
      }
    }
    this.sheetOverlayService.mouseUp.emit(event);
  }

  onStaffLineMouseDown(event: MouseEvent, staffLine: MusicLine) {
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

  onStaffLineMouseUp(event: MouseEvent, staffLine: MusicLine) {
    if (this.mouseDown) {
      this.onMouseUp(event);
    } else if (this.tool === EditorTools.CreateStaffLines) {
      // this.lineEditor.onLineMouseUp(event, staffLine.line);
    } else {
      this.onMouseUp(event);
    }
  }

  onSymbolMouseDown(event: MouseEvent, symbol: Symbol) {
    if (this.tool === EditorTools.Symbol) {
      this.symbolEditor.onSymbolMouseDown(event, symbol);
    } else if (this.tool === EditorTools.Lyrics) {
      this.lyricsEditor.onSymbolMouseDown(event, symbol);
    }
  }

  onSymbolMouseUp(event: MouseEvent, symbol: Symbol) {
    if (this.tool === EditorTools.Symbol) {
      this.symbolEditor.onSymbolMouseUp(event, symbol);
    } else if (this.tool === EditorTools.Lyrics) {
      this.lyricsEditor.onSymbolMouseUp(event, symbol);
    }

  }

  onSymbolMouseMove(event: MouseEvent, symbol: Symbol) {
    if (this.tool === EditorTools.Symbol) {
      this.symbolEditor.onSymbolMouseMove(event, symbol);
    } else {
      this.onMouseMove(event);
    }
  }

  onLyricsContainerMouseDown(event: MouseEvent, container: LyricsContainer) {
    if (this.tool === EditorTools.Lyrics) {
      this.lyricsEditor.onLyricsContainerMouseDown(event, container);
    } else {
      this.onMouseDown(event);
    }
  }

  onLyricsContainerMouseUp(event: MouseEvent, container: LyricsContainer) {
    if (this.tool === EditorTools.Lyrics) {
      this.lyricsEditor.onLyricsContainerMouseUp(event, container);
    } else {
      this.onMouseUp(event);
    }
  }

  onLyricsContainerMouseMove(event: MouseEvent, container: LyricsContainer) {
    if (this.tool === EditorTools.Lyrics) {
      this.lyricsEditor.onLyricsContainerMouseMove(event, container);
    } else {
      this.onMouseMove(event);
    }
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
    }
  }

  symbolConnection(i, symbol: Symbol, symbolList: Symbol[]): Point {
    if (symbol.symbol === SymbolType.Note && (symbol as Note).graphicalConnection === GraphicalConnectionType.Connected) {
      for (let o = i + 1; o < symbolList.length; o++) {
        if (symbolList[o].symbol === SymbolType.Note) {
          return symbolList[o].coord;
        }
      }
    }
    return null;
  }

}
