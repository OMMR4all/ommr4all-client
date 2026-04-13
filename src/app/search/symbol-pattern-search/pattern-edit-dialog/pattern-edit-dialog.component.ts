import {Component, ElementRef, HostListener, Inject, inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import machina from 'machina';
import {PatternPdfExportService} from '../pattern-pdf-export.service';

@Component({
  selector: 'app-pattern-edit-dialog',
  standalone: false,
  templateUrl: './pattern-edit-dialog.component.html',
  styleUrl: './pattern-edit-dialog.component.scss',
})
export class PatternEditDialogComponent {
  @ViewChild('svgWrapper') svgWrapper: ElementRef<HTMLDivElement>;

  private pdfExportService = inject(PatternPdfExportService);

  zoom = 1;
  panX = 0;
  panY = 0;
  pdfExporting = false;

  fsm: any;
  selectedBox: any = null;

  private startMouse = { x: 0, y: 0 };
  private startBox = { x: 0, y: 0, w: 0, h: 0 };
  private startPan = { x: 0, y: 0 };

  constructor(
    public dialogRef: MatDialogRef<PatternEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.setupFsm();
  }

  private setupFsm() {
    this.fsm = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          startPan: () => this.fsm.transition('panning'),
          startMove: () => this.fsm.transition('moving'),
          startResize: () => this.fsm.transition('resizing'),
          startDraw: () => this.fsm.transition('drawing'),
        },
        panning: {
          update: (dx: number, dy: number) => {
            // Divide by zoom so mouse perfectly tracks the pan distance
            this.panX = this.startPan.x + (dx / this.zoom);
            this.panY = this.startPan.y + (dy / this.zoom);
          },
          stop: () => this.fsm.transition('idle')
        },
        moving: {
          update: (svgCoords: {x: number, y: number}) => {
            if (this.selectedBox) {
              const deltaX = svgCoords.x - this.startMouse.x;
              const deltaY = svgCoords.y - this.startMouse.y;
              this.selectedBox.x = this.startBox.x + deltaX;
              this.selectedBox.y = this.startBox.y + deltaY;
            }
          },
          stop: () => this.fsm.transition('idle')
        },
        resizing: {
          update: (svgCoords: {x: number, y: number}) => {
            if (this.selectedBox) {
              // Ensure size cannot be negative
              this.selectedBox.w = Math.max(0.005, svgCoords.x - this.selectedBox.x);
              this.selectedBox.h = Math.max(0.005, svgCoords.y - this.selectedBox.y);
            }
          },
          stop: () => this.fsm.transition('idle')
        },
        drawing: {
          update: (svgCoords: {x: number, y: number}) => {
            if (this.selectedBox) {
              const currentW = svgCoords.x - this.startMouse.x;
              const currentH = svgCoords.y - this.startMouse.y;
              this.selectedBox.x = currentW < 0 ? svgCoords.x : this.startMouse.x;
              this.selectedBox.y = currentH < 0 ? svgCoords.y : this.startMouse.y;
              this.selectedBox.w = Math.abs(currentW);
              this.selectedBox.h = Math.abs(currentH);
            }
          },
          stop: () => {
            if (this.selectedBox && this.selectedBox.w < 0.005) {
              this.deleteSelectedBox();
            }
            this.fsm.transition('idle');
          }
        }
      }
    });
  }

  private getSvgCoords(event: MouseEvent) {
    if (!this.svgWrapper) return { x: 0, y: 0 };
    const rect = this.svgWrapper.nativeElement.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) / rect.height,
      y: (event.clientY - rect.top) / rect.height
    };
  }

  onMouseDown(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault();
      this.startMouse = { x: event.clientX, y: event.clientY };
      this.startPan = { x: this.panX, y: this.panY };
      this.fsm.handle('startPan');
      return;
    }

    if (event.button === 0 && this.fsm.state === 'idle') {
      const coords = this.getSvgCoords(event);
      this.startMouse = coords;

      const newBox = { x: coords.x, y: coords.y, w: 0, h: 0 };
      if (this.data.matches.length > 0) {
        this.data.matches[0].boxes.push(newBox);
      } else {
        this.data.matches.push({ pattern: [], boxes: [newBox] });
      }

      this.selectedBox = newBox;
      this.fsm.handle('startDraw');
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.fsm.state === 'panning') {
      const dx = event.clientX - this.startMouse.x;
      const dy = event.clientY - this.startMouse.y;
      this.fsm.handle('update', dx, dy);
    } else if (this.fsm.state !== 'idle') {
      this.fsm.handle('update', this.getSvgCoords(event));
    }
  }

  onMouseUp() {
    this.fsm.handle('stop');
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = 1.1;
    if (event.deltaY < 0) {
      this.zoom *= zoomFactor;
    } else {
      this.zoom /= zoomFactor;
    }
    this.zoom = Math.max(0.5, Math.min(this.zoom, 10));
  }

  onBoxMouseDown(event: MouseEvent, box: any) {
    if (event.button !== 0) return;
    event.stopPropagation();

    this.selectedBox = box;
    this.startMouse = this.getSvgCoords(event);
    this.startBox = { ...box };
    this.fsm.handle('startMove');
  }

  onResizeMouseDown(event: MouseEvent, box: any) {
    if (event.button !== 0) return;
    event.stopPropagation();

    this.selectedBox = box;
    this.fsm.handle('startResize');
  }

  deleteSelectedBox() {
    if (!this.selectedBox) return;
    for (const match of this.data.matches) {
      const idx = match.boxes.indexOf(this.selectedBox);
      if (idx > -1) match.boxes.splice(idx, 1);
    }
    this.selectedBox = null;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.deleteSelectedBox();
    }
  }

  resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  async exportPdf() {
    if (this.pdfExporting) return;
    this.pdfExporting = true;
    try {
      await this.pdfExportService.exportPageToPdf(this.data);
    } finally {
      this.pdfExporting = false;
    }
  }

  saveChanges() {
    this.dialogRef.close(this.data);
  }

  getPatternColor(pattern: number[]): string {
    if (!pattern || pattern.length === 0) return 'red';
    const s = pattern.join(',');
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
    let hash = 0;
    for (let i = 0; i < s.length; i++) { hash = s.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  }
}
