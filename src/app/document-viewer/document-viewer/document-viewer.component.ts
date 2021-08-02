import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {BookPermissionFlag} from '../../data-types/permissions';
import {DummyEditorTool} from '../../editor/sheet-overlay/editor-tools/editor-tool';
import {Subject, Subscription} from 'rxjs';
import {SheetOverlayComponent} from '../../editor/sheet-overlay/sheet-overlay.component';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {ActionsService} from '../../editor/actions/actions.service';
import {EditorService} from '../../editor/editor.service';
import {ServerStateService} from '../../server-state/server-state.service';
import {MatDialog} from '@angular/material';
import {ViewChangesService} from '../../editor/actions/view-changes.service';
import {ToolBarStateService} from '../../editor/tool-bar/tool-bar-state.service';
import {SheetOverlayService} from '../../editor/sheet-overlay/sheet-overlay.service';
import {BookCommunication, DocumentCommunication} from 'src/app/data-types/communication';

@Component({
  selector: 'app-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss']
})
export class DocumentViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  public bookCommunication = new BookCommunication('');
  public documentCommunication = new DocumentCommunication( this.bookCommunication, '');
  public sVGContainerWidth = undefined;
  private _subscription = new Subscription();
  private _pingStateInterval: any;
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
                  private serverState: ServerStateService,
                  public viewChanges: ViewChangesService,
                  public toolbarStateService: ToolBarStateService,
                  public sheetOverlayService: SheetOverlayService,
  ) { }

  ngAfterViewInit() { this.showViewSetting = true; }
  ngOnInit() {
    this.bookCommunication = new BookCommunication(this.route.snapshot.params.book_id);
    this.documentCommunication = new DocumentCommunication(this.bookCommunication, this.route.snapshot.params.document_id);
    this._subscription.add(this.serverState.connectedToServer.subscribe(() => {
    }));
    this._subscription.add(this.serverState.disconnectedFromServer.subscribe(() => {
    }));
  }
  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    if (this._pingStateInterval) {
      clearInterval(this._pingStateInterval);
    }
  }

  routeToBookOverview() {
    this.router.navigate(['book', this.bookCommunication.book, 'view', 'content']);

  }
  getRenderWidth() {
    if (this.sVGContainerWidth === undefined) {
      this.sVGContainerWidth = this.renderContainer.nativeElement.offsetWidth;
    }
    return this.sVGContainerWidth;
  }
  onSVGRenderFinished($event) {
    const loadingState: boolean = $event.finishedLoading;
    const nodeList: NodeList = $event.nodeList;
    this.svgLoaded = loadingState;
    this.svgNodes = nodeList;
  }
}
