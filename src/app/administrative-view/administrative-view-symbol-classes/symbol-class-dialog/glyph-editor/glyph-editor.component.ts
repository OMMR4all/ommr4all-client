import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {
  flattenToGlyphNodes,
  GlyphNode,
  parseGlyphPath,
  serializeGlyphPath,
} from './glyph-path';

/** The glyph box spans two staff-line distances, so one distance is half the box. */
const STAFF_LINE_DISTANCE = 50;
const GRID_STEP = 10;
const SNAP_STEP = 5;

@Component({
    selector: 'app-glyph-editor',
    templateUrl: './glyph-editor.component.html',
    styleUrls: ['./glyph-editor.component.scss'],
    standalone: false
})
export class GlyphEditorComponent {
  @ViewChild('canvas', {static: true}) canvas: ElementRef<SVGSVGElement>;

  /** Colour the glyph is drawn in; empty follows the surrounding text colour. */
  @Input() color = '';

  @Output() pathChange = new EventEmitter<string>();
  @Output() strokeWidthChange = new EventEmitter<number>();

  readonly gridLines = Array.from({length: 11}, (_, i) => i * GRID_STEP);
  readonly staffLineYs = [-1, 0, 1, 2].map(i => 50 - STAFF_LINE_DISTANCE / 2 + i * STAFF_LINE_DISTANCE);

  /** Nodes of the current path, or null while the path is not representable. */
  nodes: GlyphNode[] = [];
  /** True while `path` uses commands the editor cannot round-trip (an arc, for instance). */
  readOnly = false;
  /** Click on the canvas appends a point instead of only selecting one. */
  addMode = true;
  /** The next appended point starts a new subpath. */
  startNewSubpath = false;
  snapToGrid = true;
  selected = -1;

  private _path = '';
  private _strokeWidth: number = null;
  private _drag: {index: number, control: boolean} = null;

  @Input() set path(d: string) {
    if (d === this._path) { return; }
    this._path = d || '';
    const parsed = parseGlyphPath(this._path);
    this.readOnly = parsed === null;
    this.nodes = parsed || [];
    this.selected = -1;
  }
  get path() { return this._path; }

  @Input() set strokeWidth(w: number) { this._strokeWidth = w; }
  get strokeWidth() { return this._strokeWidth; }

  get hasPath() { return this.nodes.length > 0 || (this.readOnly && this._path.length > 0); }
  get stroked() { return !!this._strokeWidth; }
  get glyphColor() { return this.color || 'currentColor'; }
  get closed() { return this.nodes.length > 0 && this.nodes[this.nodes.length - 1].cmd === 'Z'; }

  /** Anchors the user can grab; `Z` carries no point of its own. */
  get anchors(): {node: GlyphNode, index: number}[] {
    return this.nodes.map((node, index) => ({node, index})).filter(a => a.node.cmd !== 'Z');
  }

  get selectedNode(): GlyphNode {
    return this.selected >= 0 && this.selected < this.nodes.length ? this.nodes[this.selected] : null;
  }

  get canCurveSelected() {
    const n = this.selectedNode;
    // the first node of a subpath is a moveto and has no incoming segment to bend
    return !!n && (n.cmd === 'L' || n.cmd === 'Q');
  }

  onCanvasPointerDown(event: PointerEvent) {
    if (this.readOnly || !this.addMode) { return; }
    const p = this.toGlyphSpace(event);
    if (!p) { return; }
    const first = this.nodes.length === 0 || this.startNewSubpath || this.closed;
    this.nodes.push({cmd: first ? 'M' : 'L', x: p.x, y: p.y});
    this.startNewSubpath = false;
    this.selected = this.nodes.length - 1;
    this.emit();
  }

  onAnchorPointerDown(event: PointerEvent, index: number, control = false) {
    event.stopPropagation();
    if (this.readOnly) { return; }
    this.selected = index;
    this._drag = {index, control};
    (event.target as Element).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (!this._drag) { return; }
    const p = this.toGlyphSpace(event);
    if (!p) { return; }
    const n = this.nodes[this._drag.index];
    if (this._drag.control) {
      n.cx = p.x;
      n.cy = p.y;
    } else {
      n.x = p.x;
      n.y = p.y;
    }
    this.emit();
  }

  onPointerUp() { this._drag = null; }

  toggleCurve() {
    const n = this.selectedNode;
    if (!n) { return; }
    if (n.cmd === 'Q') {
      n.cmd = 'L';
      n.cx = n.cy = undefined;
    } else if (n.cmd === 'L') {
      const prev = this.nodes[this.selected - 1];
      n.cmd = 'Q';
      // start the handle on the segment, so the shape does not jump
      n.cx = prev && prev.x !== undefined ? (prev.x + n.x) / 2 : n.x;
      n.cy = prev && prev.y !== undefined ? (prev.y + n.y) / 2 : n.y;
    }
    this.emit();
  }

  toggleClosed() {
    if (this.closed) {
      this.nodes.pop();
    } else if (this.nodes.length > 1) {
      this.nodes.push({cmd: 'Z'});
    }
    this.selected = -1;
    this.emit();
  }

  deleteSelected() {
    if (this.selected < 0) { return; }
    const removed = this.nodes.splice(this.selected, 1)[0];
    // a subpath must begin with a moveto: promote whatever now takes the removed one's place
    const successor = this.nodes[this.selected];
    if (removed.cmd === 'M' && successor && successor.cmd !== 'Z') { successor.cmd = 'M'; }
    if (this.nodes.length > 0 && this.nodes[0].cmd !== 'M') { this.nodes[0].cmd = 'M'; }
    this.selected = -1;
    this.emit();
  }

  undo() {
    this.nodes.pop();
    this.selected = -1;
    this.emit();
  }

  clear() {
    this.nodes = [];
    this.readOnly = false;
    this.selected = -1;
    this.emit();
  }

  /** Samples a path the editor cannot represent into a polyline it can. */
  convertToEditable() {
    this.nodes = flattenToGlyphNodes(this._path);
    this.readOnly = false;
    this.selected = -1;
    this.emit();
  }

  onStrokeWidthInput(value: string) {
    const n = value === '' || value === null ? null : Number(value);
    this._strokeWidth = (n === null || isNaN(n) || n <= 0) ? null : n;
    this.strokeWidthChange.emit(this._strokeWidth);
  }

  private emit() {
    this._path = serializeGlyphPath(this.nodes);
    this.pathChange.emit(this._path);
  }

  /** Screen coordinates of a pointer event in the 100x100 glyph space. */
  private toGlyphSpace(event: PointerEvent): {x: number, y: number} {
    const svg = this.canvas.nativeElement;
    const ctm = svg.getScreenCTM();
    if (!ctm) { return null; }
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    const snap = (v: number) => this.snapToGrid ? Math.round(v / SNAP_STEP) * SNAP_STEP : Math.round(v * 100) / 100;
    return {x: snap(p.x), y: snap(p.y)};
  }
}
