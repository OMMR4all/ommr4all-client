import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, ElementRef,
  OnChanges, OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {ActionsService} from '../editor/actions/actions.service';
import {EditorService} from '../editor/editor.service';
import {ServerStateService} from '../server-state/server-state.service';
import { MatDialog } from '@angular/material/dialog';
import {ViewChangesService} from '../editor/actions/view-changes.service';
import {EditorTools, ToolBarStateService} from '../editor/tool-bar/tool-bar-state.service';
import {SheetOverlayService} from '../editor/sheet-overlay/sheet-overlay.service';
import {DummyEditorTool} from '../editor/sheet-overlay/editor-tools/editor-tool';
import {Subject, Subscription} from 'rxjs';
import {BookPermissionFlag} from '../data-types/permissions';
import {SheetOverlayComponent} from '../editor/sheet-overlay/sheet-overlay.component';
import {ViewSettings} from '../editor/sheet-overlay/views/view';

@Component({
  selector: 'app-split-annotation-viewer',
  templateUrl: './split-annotation-viewer.component.html',
  styleUrls: ['./split-annotation-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,

})
export class SplitAnnotationViewerComponent implements OnInit, AfterViewInit, OnDestroy, AfterContentInit {

  readonly dummyEditor = new DummyEditorTool(this.sheetOverlayService, this.viewChanges, this.changeDetector);

  public svgContainerWidth = undefined;
  private _subscription = new Subscription();
  private _pingStateInterval: any;
  private _annotationState = true;
  private _renderState = true;
  private _alternativeViewer = true;
  public showViewSetting = false;
  public svgLoaded = false;
  public svgNodes: NodeList = undefined;
  eventsSubject: Subject<void> = new Subject<void>();

  @ViewChild('renderContainer', {static: true}) renderContainer: ElementRef;
  @ViewChild(SheetOverlayComponent) sheetOverlayComponent: SheetOverlayComponent;
  constructor(    private http: HttpClient,
                  private router: Router,
                  private route: ActivatedRoute,
                  private actions: ActionsService,
                  public editorService: EditorService,
                  private serverState: ServerStateService,
                  private modalDialog: MatDialog,
                  private viewRef: ViewContainerRef,
                  public viewChanges: ViewChangesService,
                  private changeDetector: ChangeDetectorRef,
                  public toolbarStateService: ToolBarStateService,
                  public sheetOverlayService: SheetOverlayService,
) {

  }
  editorCapturedMouse() { return false; }
  ngAfterViewInit() {

  }

  onInit(next ) {
    next.viewSettings = new ViewSettings(false, false, false, false, false,
      false, false, false, true, false, false, false, false);
  }


  ngOnInit() {
    this.editorService.load(this.route.snapshot.params.book_id, this.route.snapshot.params.page_id);
    this._subscription.add(this.route.paramMap.subscribe(params => {
      this.editorService.select(params.get('book_id'), params.get('page_id'));
    }));
    this._subscription.add(this.serverState.connectedToServer.subscribe(() => {
    }));
    this._subscription.add(this.serverState.disconnectedFromServer.subscribe(() => {
    }));
    this._subscription.add(this.editorService.pageStateObs.subscribe(() => {  this.changeDetector.detectChanges(); }));
    this._subscription.add(this.editorService.pageStateObs.subscribe(page => {
      this.pollStatus();
    }));
    this._pingStateInterval = setInterval(() => {
      this.pollStatus();
    }, 5_000);
  }
  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    if (this._pingStateInterval) {
      clearInterval(this._pingStateInterval);
    }
  }
  private pollStatus() {
    if (this.editorService.pageStateVal.zero) { return; }
    if (!this.editorService.bookMeta.hasPermission(BookPermissionFlag.Save)) { return; }
    this.http.get<{locked: boolean}>(this.editorService.pageCom.lock_url(), {}).subscribe(
      r => {
        this.editorService.pageStateVal.edit = r.locked;
      },
      e => {
        this.editorService.pageStateVal.edit = false;
      }
    );
  }
  get showAnnotation() { return this._annotationState; }
  get showRender() { return this._renderState; }
  get showAlternativeViewer() { return this._alternativeViewer; }

  // tslint:disable-next-line:adjacent-overload-signatures
  set showAnnotation(show: boolean) {
    if (show === this._annotationState) { return; }
    this.eventsSubject.next();
    this._annotationState = show;
  }
  // tslint:disable-next-line:adjacent-overload-signatures
  set showRender(show: boolean) {
    if (show === this._renderState) { return; }
    this._renderState = show;
  }
  set showAlternativeViewer(show: boolean) {
    if (show === this._alternativeViewer) { return; }
    this._alternativeViewer = show;
  }
  routeToEditor() {
    this.router.navigate(['book', this.editorService.bookCom.book, 'page', this.editorService.pageCom.page, 'edit']);

  }

  routeToBookOverview() {
    this.router.navigate(['book', this.editorService.bookCom.book, 'view', 'content']);

  }
  getRenderWidth() {
    if (this.svgContainerWidth === undefined) {
      this.svgContainerWidth = this.renderContainer.nativeElement.offsetWidth;
    }

    return this.svgContainerWidth;
  }
  onSVGRenderFinished($event) {
    const loadingState: boolean = $event.finishedLoading;
    const nodeList: NodeList = $event.nodeList;
    this.svgLoaded = loadingState;
    this.svgNodes = nodeList;
  }

  ngAfterContentInit(): void {
    this.toolbarStateService.currentEditorTool
  }
}

