import {Component, ElementRef, Input, OnDestroy, OnInit, inject} from '@angular/core';
import {Subscription} from 'rxjs';
import {MusicSymbol} from '../../../../../data-types/page/music-region/symbol';
import {SymbolClassDescriptor} from '../../../../../data-types/page/symbol-class-registry';
import {Point} from '../../../../../geometry/geometry';
import {UserViewSettingsService} from '../../../../../user-view-settings.service';
import {applyAppearanceCssVars} from '../../../../appearance/appearance-settings';

/**
 * Shows a symbol class exactly as the sheet overlay draws it.
 *
 * The rendering is not reimplemented here: the real `SymbolComponent` is instantiated on a
 * throwaway symbol over a synthetic four-line staff, so a box-shaped note stays a box, a clef
 * keeps its `CLEF_GEOMS` geometry and a registered class is scaled to two staff-line distances
 * just like on a page. `STAFF_LINE_DISTANCE` is a plausible editor value rather than an
 * arbitrary one, because the shaped note glyphs (oriscus, apostropha, liquescents) carry a
 * fixed scale and only look right relative to a realistic staff.
 */
const STAFF_LINE_DISTANCE = 20;
const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 90;
/** Centre of the staff, on the space between the second and the third line. */
const CENTER = new Point(VIEW_WIDTH / 2, 40);

@Component({
    selector: 'app-symbol-preview',
    templateUrl: './symbol-preview.component.html',
    styleUrls: ['./symbol-preview.component.scss'],
    standalone: false
})
export class SymbolPreviewComponent implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private userViewSettings = inject(UserViewSettingsService);

  /** Display height in px; the width follows from the fixed aspect ratio. */
  @Input() heightPx = 108;

  readonly viewBox = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;
  readonly size = STAFF_LINE_DISTANCE;
  readonly staffLineYs = [0, 1, 2, 3].map(i => CENTER.y - 1.5 * STAFF_LINE_DISTANCE + i * STAFF_LINE_DISTANCE);

  symbol: MusicSymbol;

  private _descriptor: SymbolClassDescriptor;
  private _subscription: Subscription;

  @Input() set descriptor(d: SymbolClassDescriptor) {
    this._descriptor = d;
    this.symbol = d ? this.buildSymbol(d) : undefined;
  }
  get descriptor() { return this._descriptor; }

  get widthPx() { return this.heightPx * VIEW_WIDTH / VIEW_HEIGHT; }

  ngOnInit() {
    this.applyAppearance();
    this._subscription = this.userViewSettings._userConfigStateObs.subscribe(() => this.applyAppearance());
  }

  ngOnDestroy() {
    if (this._subscription) { this._subscription.unsubscribe(); }
  }

  /** The overlay stylesheets resolve their colours through `var(--ommr-…)`. */
  private applyAppearance() {
    applyAppearanceCssVars(this.elementRef.nativeElement, id => this.userViewSettings.appearance(id));
  }

  private buildSymbol(d: SymbolClassDescriptor): MusicSymbol {
    const s = MusicSymbol.fromType(d.symbolType, d.subType, d.classId || null);
    if (!s) { return undefined; }
    // no staff is attached, so the symbol reports an undefined position and renders in the
    // off-staff-line colour -- which is what the centre of a space looks like on a page
    s.coord = CENTER.copy();
    return s;
  }
}
