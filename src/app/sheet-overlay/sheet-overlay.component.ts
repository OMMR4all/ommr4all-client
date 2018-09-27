import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {LineEditorComponent} from '../line-editor/line-editor.component';
import {StaffGrouperComponent} from '../staff-grouper/staff-grouper.component';
import * as svgPanZoom from 'svg-pan-zoom';
import {Staff, StaffLine, Staffs} from '../musical-symbols/StaffLine';
import {PolyLine} from '../geometry/geometry';
import {StaffsService} from '../staffs.service';
import {SymbolEditorComponent} from '../symbol-editor/symbol-editor.component';
import {SheetOverlayService} from './sheet-overlay.service';
import {Symbol, SymbolType} from '../musical-symbols/symbol';
import {LyricsEditorComponent} from '../lyrics-editor/lyrics-editor.component';
import {LyricsContainer} from '../musical-symbols/lyrics';
import {EditorTools, ToolBarStateService} from '../tool-bar/tool-bar-state.service';

@Component({
  selector: 'app-sheet-overlay',
  templateUrl: './sheet-overlay.component.html',
  styleUrls: ['./sheet-overlay.component.css']
})
export class SheetOverlayComponent implements OnInit, AfterViewInit {
  EditorTools = EditorTools;
  symbolType = SymbolType;
  @ViewChild(LineEditorComponent) lineEditor: LineEditorComponent;
  @ViewChild(StaffGrouperComponent) staffGrouper: StaffGrouperComponent;
  @ViewChild(SymbolEditorComponent) symbolEditor: SymbolEditorComponent;
  @ViewChild(LyricsEditorComponent) lyricsEditor: LyricsEditorComponent;
  @ViewChild('svgRoot')
    private svgRoot: ElementRef;

  private clickX: number;
  private clickY: number;
  private dragging = false;
  private minDragDistance = 10;
  private mouseDown = false;

  private static _isDragEvent(event: MouseEvent): boolean {
    return event.button === 1 || (event.button === 0 && event.altKey);
  }

  get staffs() {
    return this.staffService.staffs;
  }

  get sheetHeight() {
    return this.staffService.height;
  }

  get sheetWidth() {
    return this.staffService.width;
  }


  constructor(public toolBarStateService: ToolBarStateService,
              public staffService: StaffsService,
              public sheetOverlayService: SheetOverlayService) { }


  ngOnInit() {
    this.sheetOverlayService.svgRoot = this.svgRoot;
    this.lineEditor.setCallbacks(
      this.lineFinished.bind(this),
      this.lineDeleted.bind(this),
      this.lineUpdated.bind(this)
    );
    this.staffs.addStaff(new Staff([]));
    this.toolBarStateService.editorToolChanged.subscribe((v) => { this.onToolChanged(v); });
  }

  ngAfterViewInit() {
    svgPanZoom('#svgRoot', {
      viewportSelector: '#svgRoot',
      eventsListenerElement: document.querySelector('#svgSheet'),
      beforePan: this.beforePan.bind(this),
      dblClickZoomEnabled: false
    });
  }

  get tool(): EditorTools {
    return this.toolBarStateService.currentEditorTool;
  }

  onToolChanged(newState) {
    if (newState === EditorTools.Lyrics) {
      this.staffs.generateAutoLyricsPosition();
    }
    this.lyricsEditor.states.transition('idle');
  }

  lineUpdated(line: PolyLine) {
    const staff = this.staffs.staffContainingLine(line);
    if (staff) {
      staff.update();
    }
  }

  lineFinished(line: PolyLine) {
    // get closest staff, check if line is in avg staff line distance, else create a new staff with that line
    const closestStaff = this.sheetOverlayService.closestStaffToMouse;
    if (closestStaff === null) {
      this.staffs.addStaff(new Staff([new StaffLine(line)]));
    } else {
      const y = line.averageY();
      if (closestStaff.lines.length === 1 ||
        (y < closestStaff._staffaabb.bl().y + closestStaff.avgStaffLineDistance * 2 &&
        y > closestStaff._staffaabb.tl().y - closestStaff.avgStaffLineDistance * 2)) {
        closestStaff.addLine(new StaffLine(line));
      } else {
        this.staffs.addStaff(new Staff([new StaffLine(line)]));
      }
    }
  }

  lineDeleted(line: PolyLine) {
    this.staffs.removeLine(line);
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
      if (this.tool === EditorTools.CreateStaffLines) {
        this.lineEditor.onMouseMove(event);
      } else if (this.tool === EditorTools.GroupStaffLines) {
        this.staffGrouper.onMouseMove(event);
      } else if (this.tool === EditorTools.Symbol) {
        this.symbolEditor.onMouseMove(event);
      } else if (this.tool === EditorTools.Lyrics) {
        this.lyricsEditor.onMouseMove(event);
      }
    }
  }

  updateClosedStaffToMouse(event: MouseEvent) {
    const p = this.sheetOverlayService.mouseToSvg(event);
    this.sheetOverlayService.closestStaffToMouse = this.staffs.closestStaffToPoint(p);
  }


  onMouseDown(event: MouseEvent) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.clickX = event.clientX;
      this.clickY = event.clientY;
      this.dragging = false;
      this.mouseDown = true;
      event.preventDefault();
    } else {
      if (this.tool === EditorTools.CreateStaffLines) {
        if (this.lineEditor.onMouseDown(event)) {
          return;
        }
      } else if (this.tool === EditorTools.GroupStaffLines) {
        if (this.staffGrouper.onMouseDown(event)) {
          return;
        }
      } else if (this.tool === EditorTools.Symbol) {
        if (this.symbolEditor.onMouseDown(event)) {
          return;
        }
      } else if (this.tool === EditorTools.Lyrics) {
        this.lyricsEditor.onMouseDown(event);
        return;
      }
    }
  }

  onMouseUp(event: MouseEvent) {
    if (this.mouseDown) {
      this.clickX = null;
      this.clickY = null;
      this.dragging = false;
      this.mouseDown = false;
      event.preventDefault();
    } else {
      if (this.tool === EditorTools.CreateStaffLines) {
        if (!this.dragging) {
          this.lineEditor.onMouseUp(event);
        }
      } else if (this.tool === EditorTools.GroupStaffLines) {
        this.staffGrouper.onMouseUp(event);
      } else if (this.tool === EditorTools.Symbol) {
        if (!this.dragging) {
          this.symbolEditor.onMouseUp(event);
        }
      } else if (this.tool === EditorTools.Lyrics) {
        this.lyricsEditor.onMouseUp(event);
      }
    }
  }

  onStaffLineMouseDown(event: MouseEvent, staffLine: StaffLine) {
    if (SheetOverlayComponent._isDragEvent(event)) {
      this.onMouseDown(event);
    } else {
      if (this.tool === EditorTools.CreateStaffLines) {
        this.lineEditor.onLineMouseDown(event, staffLine.line);
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
}
