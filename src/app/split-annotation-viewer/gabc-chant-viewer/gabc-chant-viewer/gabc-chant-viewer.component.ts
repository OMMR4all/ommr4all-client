import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, SimpleChanges, OnChanges, OnDestroy, inject } from '@angular/core';
import {Subscription} from "rxjs";
import {PageLine} from "../../../data-types/page/pageLine";
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
  /** Upper bound for the render height, as a multiple of the staff height it is placed above. */
  private static readonly maxHeightFactor = 2;

  changeDetector = inject(ChangeDetectorRef);
  private sheetOverlayService = inject(SheetOverlayService);
  private viewChanges = inject(ViewChangesService);

  private _subscription = new Subscription();
  private _line: PageLine = null;
  private gabcText = '';

  // Intrinsic size of the last exsurge render, in px. Exsurge lays out at a fixed font size, so
  // this is independent of both the sheet zoom and the staff it belongs to -- `scale` bridges the two.
  private renderWidth = 0;
  private renderHeight = 0;
  private hasRendered = false;

  @Input() zoom = 1;
  @Input() pan = {x: 0, y: 0};

  get getGabcText() { return this.gabcText; }

  /** Hidden until the first successful render of a line, so it never flashes at a stale offset. */
  get visible() { return this._line !== null && this.hasRendered; }

  /**
   * Fit the render to the width of the staff it belongs to, so the notation tracks the sheet zoom
   * and its neumes sit roughly above the symbols they were generated from.
   */
  get scale() {
    if (!this._line || this.renderWidth <= 0) { return 1; }
    const aabb = this._line.AABB;
    const byWidth = (aabb.size.w * this.zoom) / this.renderWidth;
    if (this.renderHeight <= 0) { return byWidth; }
    // A staff holding only a couple of symbols renders far narrower than the line, and matching its
    // width alone would blow the notation up. Cap it against the staff height instead; the factor
    // leaves room for the lyrics, which exsurge draws below the staff and counts in renderHeight.
    const byHeight = (aabb.size.h * this.zoom * GabcChantViewerComponent.maxHeightFactor) / this.renderHeight;
    return Math.min(byWidth, byHeight);
  }

  get scaledWidth() { return this.renderWidth * this.scale; }
  get scaledHeight() { return this.renderHeight * this.scale; }

  get left() {
    if (!this._line) { return 0; }
    return Math.max(0, this._line.AABB.left * this.zoom + this.pan.x);
  }

  /**
   * Always above the staff: the lyrics sit below it and have to stay readable while transcribing.
   * Clamped like `left`, because the surrounding .svg-overlay clips -- for the topmost staff of a
   * page the render would otherwise be cut in half rather than merely overlapping it.
   */
  get top() {
    if (!this._line) { return 0; }
    return Math.max(0, this._line.AABB.top * this.zoom + this.pan.y - this.scaledHeight);
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
    this.renderWidth = 0;
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
    this.renderWidth = bounds.width;
    this.renderHeight = bounds.height;
    this.hasRendered = true;
    this.changeDetector.detectChanges();
  }
}
