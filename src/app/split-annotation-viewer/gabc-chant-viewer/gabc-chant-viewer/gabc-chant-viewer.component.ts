import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, SimpleChanges, OnChanges, OnDestroy, inject } from '@angular/core';
import {Subscription} from "rxjs";
import {PageLine} from "../../../data-types/page/pageLine";
import {Constants} from "../../../data-types/page/definitions";
import {SheetOverlayService} from "../../../editor/sheet-overlay/sheet-overlay.service";
import {ViewChangesService} from "../../../editor/actions/view-changes.service";

@Component({
    selector: 'app-gabc-chant-viewer',
    templateUrl: './gabc-chant-viewer.component.html',
    styleUrls: ['./gabc-chant-viewer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class GabcChantViewerComponent implements OnInit, OnChanges, OnDestroy {
  changeDetector = inject(ChangeDetectorRef);
  private sheetOverlayService = inject(SheetOverlayService);
  private viewChanges = inject(ViewChangesService);

  private _subscription = new Subscription();
  private _line: PageLine = null;
  private gabcText = '';

  // Size of the last exsurge render, in screen px. The notation is not scaled by the sheet zoom,
  // so this is directly comparable to the zoom-scaled gaps below.
  private renderHeight = 0;
  private hasRendered = false;

  // Free vertical space above/below the hovered line, in page coordinates. Cached per line because
  // it walks every line on the page; recomputed whenever the line or its content changes.
  private gapAbove = 0;
  private gapBelow = 0;

  @Input() zoom = 1;
  @Input() pan = {x: 0, y: 0};

  get getGabcText() { return this.gabcText; }

  /** Hidden until the first successful render of a line, so it never flashes at a stale offset. */
  get visible() { return this._line !== null && this.hasRendered; }

  get left() {
    if (!this._line) { return 0; }
    return Math.max(0, this._line.AABB.left * this.zoom + this.pan.x);
  }

  /**
   * Preference is above the staff: the lyrics sit below it and stay readable that way. Only drop
   * below when the render genuinely does not fit above.
   */
  get top() {
    if (!this._line) { return 0; }
    const aabb = this._line.AABB;
    const fitsAbove = this.gapAbove * this.zoom >= this.renderHeight;
    const fitsBelow = this.gapBelow * this.zoom >= this.renderHeight;
    const placeAbove = fitsAbove || (!fitsBelow && this.gapAbove >= this.gapBelow);
    return placeAbove
      ? aabb.top * this.zoom + this.pan.y - this.renderHeight
      : aabb.bottom * this.zoom + this.pan.y;
  }

  constructor() {
    this.changeDetector.detach();
  }

  ngOnInit() {
    // Every edit and every hover change funnels through ViewChangesService; the string diff in
    // onViewChanged() is what keeps that firehose cheap.
    this._subscription.add(this.viewChanges.changed.subscribe(() => this.onViewChanged()));
    this.onViewChanged();
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('pan' in changes || 'zoom' in changes) { this.reposition(); }
  }

  private onViewChanged() {
    const line = this.sheetOverlayService.closestStaffToMouse;
    const lineChanged = line !== this._line;
    this._line = line;

    const next = this.generate();
    // Hover/selection churn on an unchanged line: nothing moved and nothing to re-layout.
    if (!lineChanged && next === this.gabcText) { return; }

    this.applySource(next);
    this.updateGaps();
    this.changeDetector.detectChanges();
  }

  /**
   * Only invalidate the measurement when the source really changes. Two staves can produce
   * identical GABC, and then the wrapper's `source` input does not change, so it never re-renders
   * and never emits `rendered` again -- resetting hasRendered there would hide the box forever.
   */
  private applySource(next: string) {
    if (next === this.gabcText) { return; }
    this.gabcText = next;
    this.hasRendered = false;
    this.renderHeight = 0;
  }

  private generate(): string {
    // An empty staff still yields a non-empty (and malformed) GABC preamble, so render nothing.
    if (!this._line || this._line.symbols.length === 0) { return ''; }
    return this._line.generateGabcString();
  }

  /** Style-only update; the getters recompute from the cached gaps. */
  private reposition() {
    this.changeDetector.detectChanges();
  }

  onRendered(bounds: {width: number, height: number}) {
    this.renderHeight = bounds.height;
    this.hasRendered = true;
    this.changeDetector.detectChanges();
  }

  private updateGaps() {
    if (!this._line) { this.gapAbove = 0; this.gapBelow = 0; return; }
    const aabb = this._line.AABB;
    const block = this._line.getBlock();
    const page = block ? block.page : null;

    // Page bounds: client space is height-normalised and scaled by GLOBAL_SCALING, so y is [0, 1000].
    let above = aabb.top;
    let below = Constants.GLOBAL_SCALING - aabb.bottom;

    if (page) {
      page.blocks.forEach(b => b.lines.forEach(other => {
        if (other === this._line) { return; }
        const o = other.AABB;
        // Ignore anything in a different column - it can never be overlapped.
        if (o.right <= aabb.left || o.left >= aabb.right) { return; }
        if (o.bottom <= aabb.top) { above = Math.min(above, aabb.top - o.bottom); }
        if (o.top >= aabb.bottom) { below = Math.min(below, o.top - aabb.bottom); }
      }));
    }

    this.gapAbove = Math.max(0, above);
    this.gapBelow = Math.max(0, below);
  }
}
