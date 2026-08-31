import {
  AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, QueryList, SimpleChanges, ViewChildren, inject
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {PageCommunication} from '../../../data-types/communication';
import {PcGts} from '../../../data-types/page/pcgts';
import {PageLine} from '../../../data-types/page/pageLine';
import {PitchDetectionParams} from '../../../data-types/page/pitch-detection-params';
import {EditorTool} from '../../../editor/sheet-overlay/editor-tools/editor-tool';
import {ViewSettings} from '../../../editor/sheet-overlay/views/view';
import {SheetOverlayService} from '../../../editor/sheet-overlay/sheet-overlay.service';
import {ViewChangesService} from '../../../editor/actions/view-changes.service';
import {SymbolsViewComponent} from '../../../editor/sheet-overlay/views/symbols-view/symbols-view.component';
import {StaffLinesViewComponent} from '../../../editor/sheet-overlay/views/staff-lines-view/staff-lines-view.component';
import {PisAreaViewComponent} from '../../../editor/sheet-overlay/views/pis-area-view/pis-area-view.component';
import {apiErrorFromHttpErrorResponse} from '../../../utils/api-error';

/**
 * A tool that only carries view settings. The overlay views take an EditorTool to ask what to draw
 * and what is selectable; everything interactive is off here, so the preview cannot be edited.
 */
class PisPreviewTool extends EditorTool {
  constructor(sheetOverlayService: SheetOverlayService, viewChanges: ViewChangesService, changeDetector: ChangeDetectorRef) {
    super(sheetOverlayService, viewChanges, changeDetector, new ViewSettings(
      true,   // showStaffLines
      false,  // showStaffGroupShading
      false,  // showLayout
      true,   // showSymbols
      false,  // showBoundingBoxes
      false,  // showReadingOrder
      false,  // showAnnotations
      false,  // showComments
      true,   // showBackground
      false,  // showSymbolCenterOnly
      false,  // showSymbolConfidence
      false,  // showAlternateSymbolsView
      false,  // showRenderedView
      false,  // showDocumentStartView
      true,   // showPisArea
    ));
  }
}

/**
 * Read-only rendering of one page: the scan with its staff lines, its symbols and the areas each
 * position in staff claims.
 *
 * Deliberately not the editor's SheetOverlayComponent: that one renders the globally loaded page of
 * the EditorService and registers itself as the single overlay of the application, so showing a page
 * here would reset whatever the user has open in the editor, including the undo stack.
 */
@Component({
  selector: 'app-pis-preview',
  templateUrl: './pis-preview.component.html',
  styleUrls: ['./pis-preview.component.scss'],
  standalone: false
})
export class PisPreviewComponent implements OnChanges, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private changeDetector = inject(ChangeDetectorRef);
  private sheetOverlayService = inject(SheetOverlayService);
  private viewChanges = inject(ViewChangesService);

  @Input() pageCom: PageCommunication;
  @Input() pitchParams: PitchDetectionParams;

  @ViewChildren(SymbolsViewComponent) symbolViews: QueryList<SymbolsViewComponent>;
  @ViewChildren(StaffLinesViewComponent) staffLineViews: QueryList<StaffLinesViewComponent>;
  @ViewChildren(PisAreaViewComponent) pisAreaViews: QueryList<PisAreaViewComponent>;

  readonly tool: EditorTool;

  static readonly minZoom = 0.25;
  static readonly maxZoom = 6;

  pcgts: PcGts = null;
  loading = false;
  errorMessage = '';

  private _zoom = 1;

  private _request = new Subscription();

  constructor() {
    this.tool = new PisPreviewTool(this.sheetOverlayService, this.viewChanges, this.changeDetector);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pageCom']) {
      this.load();
    } else if (changes['pitchParams'] && this.pcgts) {
      this.applyParams();
    }
  }

  ngAfterViewInit(): void {
    this.redrawViews();
  }

  ngOnDestroy(): void {
    this._request.unsubscribe();
    this.tool.destroy();
  }

  get zoom() { return this._zoom; }
  /** The range input writes strings, the wheel handler numbers; both are clamped here. */
  set zoom(value: number | string) {
    const z = Number(value);
    if (!isFinite(z)) { return; }
    const clamped = Math.max(PisPreviewComponent.minZoom, Math.min(z, PisPreviewComponent.maxZoom));
    // rounded so the readout stays readable after the multiplicative wheel steps
    this._zoom = Math.round(clamped * 100) / 100;
  }

  onWheel(event: WheelEvent) {
    if (!event.ctrlKey) { return; }   // plain wheel keeps scrolling the viewport
    event.preventDefault();           // also suppresses the browser's own pinch zoom
    this.zoom = event.deltaY < 0 ? this._zoom * 1.1 : this._zoom / 1.1;
  }

  get page() { return this.pcgts ? this.pcgts.page : null; }
  get musicLines(): PageLine[] {
    if (!this.pcgts) { return []; }
    return this.pcgts.page.musicRegions.reduce((lines, block) => lines.concat(block.lines), [] as PageLine[]);
  }

  get imageUrl() { return this.pageCom ? this.pageCom.image_url('color', 'lowres_preproc') : ''; }
  get viewBox() {
    if (!this.page) { return '0 0 1 1'; }
    return '0 0 ' + this.page.imageWidth + ' ' + this.page.imageHeight;
  }

  load() {
    this._request.unsubscribe();
    this.pcgts = null;
    this.errorMessage = '';
    if (!this.pageCom) { return; }

    this.loading = true;
    this._request = new Subscription();
    this._request.add(this.http.get(this.pageCom.content_url('pcgts')).subscribe(
      r => {
        this.loading = false;
        this.pcgts = PcGts.fromJson(r, this.pitchParams);
        this.redrawViews();
      },
      err => {
        this.loading = false;
        const error = apiErrorFromHttpErrorResponse(err);
        this.errorMessage = error ? error.userMessage : $localize`The page could not be loaded.`;
        this.changeDetector.markForCheck();
      },
    ));
  }

  /** Re-renders with new tolerances; nothing is stored, this only changes what is drawn. */
  applyParams() {
    if (!this.pcgts) { return; }
    this.pcgts.page.pitchParams = this.pitchParams;
    this.redrawViews();
  }

  private redrawViews() {
    // the overlay views run with a detached change detector and are repainted by their parent
    setTimeout(() => {
      if (this.pisAreaViews) { this.pisAreaViews.forEach(v => v.redraw()); }
      if (this.staffLineViews) { this.staffLineViews.forEach(v => v.redraw()); }
      if (this.symbolViews) { this.symbolViews.forEach(v => v.redraw()); }
    });
  }
}
