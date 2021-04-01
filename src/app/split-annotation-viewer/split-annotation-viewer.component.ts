import {ChangeDetectorRef, Component, OnInit, ViewContainerRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {ActionsService} from '../editor/actions/actions.service';
import {EditorService} from '../editor/editor.service';
import {ServerStateService} from '../server-state/server-state.service';
import {MatDialog} from '@angular/material';
import {ViewChangesService} from '../editor/actions/view-changes.service';
import {ToolBarStateService} from '../editor/tool-bar/tool-bar-state.service';
import {AutoSaver} from '../editor/auto-saver';
import {SheetOverlayService} from '../editor/sheet-overlay/sheet-overlay.service';
import {ShortcutService} from '../editor/shortcut-overlay/shortcut.service';
import {DummyEditorTool} from '../editor/sheet-overlay/editor-tools/editor-tool';
import {Subscription} from 'rxjs';
import {ActionType} from '../editor/actions/action-types';
import {BookPermissionFlag} from '../data-types/permissions';

@Component({
  selector: 'app-split-annotation-viewer',
  templateUrl: './split-annotation-viewer.component.html',
  styleUrls: ['./split-annotation-viewer.component.scss']
})
export class SplitAnnotationViewerComponent implements OnInit {
  readonly dummyEditor = new DummyEditorTool(this.sheetOverlayService, this.viewChanges, this.changeDetector);
  private _subscription = new Subscription();
  private _pingStateInterval: any;

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

  ngOnInit() {
    this.editorService.load(this.route.snapshot.params.book_id, this.route.snapshot.params.page_id);
    this._subscription.add(this.route.paramMap.subscribe(params => {
      this.editorService.select(params.get('book_id'), params.get('page_id'));
    }));
    this._subscription.add(this.editorService.pageStateObs.subscribe(page => {
      this.pollStatus();
    }));
    this._subscription.add(this.serverState.connectedToServer.subscribe(() => {
    }));
    this._subscription.add(this.serverState.disconnectedFromServer.subscribe(() => {
    }));

    this._pingStateInterval = setInterval(() => {
      this.pollStatus();
    }, 5_000);
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
}
