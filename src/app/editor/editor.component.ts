import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {EditorTools, ToolBarStateService} from './tool-bar/tool-bar-state.service';
import {EditorService} from './editor.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SheetOverlayComponent} from './sheet-overlay/sheet-overlay.component';
import {ActionsService} from './actions/actions.service';
import {DetectStaffLinesDialogComponent} from './dialogs/detect-stafflines-dialog/detect-stafflines-dialog.component';
import {DetectSymbolsDialogComponent} from './dialogs/detect-symbols-dialog/detect-symbols-dialog.component';
import {AutoSaver} from './auto-saver';
import {ServerStateService} from '../server-state/server-state.service';
import {LayoutAnalysisDialogComponent} from './dialogs/layout-analysis-dialog/layout-analysis-dialog.component';
import {NotePropertyWidgetComponent} from './property-widgets/note-property-widget/note-property-widget.component';
import {ViewChangesService} from './actions/view-changes.service';
import {Subscription} from 'rxjs';
import {MatDialog} from '@angular/material';
import {TaskStatusCodes} from './task';
import {HttpClient} from '@angular/common/http';
import {LyricsPasteToolDialogComponent} from './dialogs/lyrics-paste-tool-dialog/lyrics-paste-tool-dialog.component';
import {OverrideEditLockDialogComponent} from './dialogs/override-edit-lock-dialog/override-edit-lock-dialog.component';
import {ActionType} from './actions/action-types';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class EditorComponent implements OnInit, OnDestroy {
  private _subscription = new Subscription();
  @ViewChild(SheetOverlayComponent, {static: false}) sheetOverlayComponent: SheetOverlayComponent;
  @ViewChild(NotePropertyWidgetComponent, {static: false}) notePropertyWidget: NotePropertyWidgetComponent;

  readonly TaskStatusCodes = TaskStatusCodes;
  readonly ET = EditorTools;

  private _pingStateInterval: any;
  public autoSaver: AutoSaver;
  editorCapturedMouse() { return this.sheetOverlayComponent ? this.sheetOverlayComponent.mouseCaptured() : false; }

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private actions: ActionsService,
    public editorService: EditorService,
    private serverState: ServerStateService,
    private modalDialog: MatDialog,
    private viewRef: ViewContainerRef,
    public viewChanges: ViewChangesService,
    private changeDetector: ChangeDetectorRef,
    public toolbarStateService: ToolBarStateService) {
    this.autoSaver = new AutoSaver(actions, editorService, serverState);
    this.editorService.currentPageChanged.subscribe(() => {
      this.autoSaver.destroy();
      this.autoSaver = new AutoSaver(actions, editorService, serverState);
    });
  }

  ngOnDestroy(): void {
    this.autoSaver.destroy();
    this._subscription.unsubscribe();
    if (this._pingStateInterval) {
      clearInterval(this._pingStateInterval);
    }
    this.releaseEditPage();
  }

  ngOnInit() {
    this.editorService.load(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
    this._subscription.add(this.route.paramMap.subscribe(params => {
      this.editorService.select(params.get('book_id'), params.get('page_id'));
    }));

    this._subscription.add(this.toolbarStateService.runStaffDetection.subscribe(() => this.openStaffDetectionDialog()));
    this._subscription.add(this.toolbarStateService.runSymbolDetection.subscribe(() => this.openSymbolDetectionDialog()));
    this._subscription.add(this.toolbarStateService.runLayoutAnalysis.subscribe(() => this.openLayoutAnalysisDialog()));
    this._subscription.add(this.toolbarStateService.editorToolChanged.subscribe(() => this.changeDetector.markForCheck()));
    this._subscription.add(this.toolbarStateService.runLyricsPasteTool.subscribe(() => this.openLyricsPasteTool()));
    this._subscription.add(this.toolbarStateService.requestEditPage.subscribe(() => this.requestEditPage()));
    this._subscription.add(this.editorService.pageStateObs.subscribe(() => {  this.changeDetector.detectChanges(); }));
    this._subscription.add(this.editorService.pageStateObs.subscribe(page => {
      this.pollStatus();
    }));
    this._subscription.add(this.serverState.connectedToServer.subscribe(() => {
    }));
    this._subscription.add(this.serverState.disconnectedFromServer.subscribe(() => {
    }));
    this._subscription.add(this.actions.actionCalled.subscribe(
      action => {
        if (action === ActionType.Undo || action === ActionType.Redo) {
          this.sheetOverlayComponent.currentEditorTool.redraw();
        }
      }
    ));

    this._pingStateInterval = setInterval(() => {
      this.pollStatus();
    }, 5_000);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.editorService.actionStatistics.tick();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Match for undo redy (mac also meta key)
    if ((event.code === 'KeyZ' || event.code === 'KeyY') && (event.ctrlKey || event.metaKey)) {
      this.sheetOverlayComponent.toIdle();
      if (event.shiftKey && event.code === 'KeyZ' || !event.shiftKey && event.code === 'KeyY') {
        this.actions.redo();
      } else {
        this.actions.undo();
      }
      event.preventDefault();
    }
  }

  private pollStatus() {
    if (this.editorService.pageStateVal.zero) { return; }
    this.http.get<{locked: boolean}>(this.editorService.pageCom.lock_url(), {}).subscribe(
      r => {
        this.editorService.pageStateVal.edit = r.locked;
      },
      e => {
        this.editorService.pageStateVal.edit = false;
      }
    );
  }

  private requestEditPage(force = false) {
    this.http.put<{locked: boolean, first_name: string, last_name: string, email: string}>(this.editorService.pageCom.lock_url(), {force}).subscribe(
      r => {
        this.editorService.pageStateVal.edit = r.locked;
        if (!r.locked) {
          // locked by another user, request to override
          this.modalDialog.open(OverrideEditLockDialogComponent, {
            width: '300px',
            disableClose: false,
            data: r,
          }).afterClosed().subscribe(forceRetry => {
            if (forceRetry) {
              this.requestEditPage(forceRetry);
            }
          });
        }
      }
    );
  }

  private releaseEditPage() {
    if (!this.editorService.pageStateVal.edit) { return; }
    this.http.delete(this.editorService.pageCom.lock_url(), {}).subscribe(
      r => {
      }
    );
  }

  private openStaffDetectionDialog() {
    const state = this.editorService.pageStateVal;
    if (!state) { return; }

    this.modalDialog.open(DetectStaffLinesDialogComponent, {
      width: '300px',
      disableClose: true,
      data: {
        pageState: state,
        onClosed: () => this.editorService.staffDetectionFinished.emit(state),
      }
    });
  }

  private openSymbolDetectionDialog() {
    const state = this.editorService.pageStateVal;
    if (!state) { return; }

    this.modalDialog.open(DetectSymbolsDialogComponent, {
      disableClose: true,
      width: '300px',
      data: {
        pageState: state,
        onClosed: () => this.editorService.symbolDetectionFinished.emit(state),
      }
    });
  }

  private openLayoutAnalysisDialog() {
    const state = this.editorService.pageStateVal;
    if (!state) { return; }

    this.modalDialog.open(LayoutAnalysisDialogComponent, {
      disableClose: true,
      width: '300px',
      data: {
        pageState: state,
        onClosed: () => { this.editorService.layoutAnalysisFinished.emit(state); },
      }
    });
  }

  private openLyricsPasteTool() {
    this.modalDialog.open(LyricsPasteToolDialogComponent, {
      disableClose: false,
      width: '600px',
      data: {
        page: this.editorService.pcgts.page,
      }
    }).afterClosed().subscribe( () => {
        this.toolbarStateService.currentEditorTool = EditorTools.Syllables;
      }
    );
  }
}
