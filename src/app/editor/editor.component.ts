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
import {EditorTools, PrimaryViews, ToolBarStateService} from './tool-bar/tool-bar-state.service';
import {EditorService} from './editor.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SheetOverlayComponent} from './sheet-overlay/sheet-overlay.component';
import {ActionsService} from './actions/actions.service';
import {DetectStaffLinesDialogComponent} from './dialogs/detect-stafflines-dialog/detect-stafflines-dialog.component';
import {DetectSymbolsDialogComponent} from './dialogs/detect-symbols-dialog/detect-symbols-dialog.component';
import {TrainSymbolsDialogComponent} from './dialogs/train-symbols-dialog/train-symbols-dialog.component';
import {AutoSaver} from './auto-saver';
import {ServerStateService} from '../server-state/server-state.service';
import {LayoutAnalysisDialogComponent} from './dialogs/layout-analysis-dialog/layout-analysis-dialog.component';
import {NotePropertyWidgetComponent} from './property-widgets/note-property-widget/note-property-widget.component';
import {ViewChangesService} from './actions/view-changes.service';
import {Subscription} from 'rxjs';
import {MatDialog} from '@angular/material';
import {TaskPoller, TaskStatusCodes} from './task';
import {HttpClient} from '@angular/common/http';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit, OnDestroy {
  private _subscription = new Subscription();
  @ViewChild(SheetOverlayComponent) sheetOverlayComponent: SheetOverlayComponent;
  @ViewChild(NotePropertyWidgetComponent) notePropertyWidget: NotePropertyWidgetComponent;

  readonly TaskStatusCodes = TaskStatusCodes;
  readonly PrimaryViews = PrimaryViews;
  readonly ET = EditorTools;

  private _symbolsTrainingTask: TaskPoller = null;
  get symbolsTrainingTask() { return this._symbolsTrainingTask; }
  public autoSaver: AutoSaver;

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
    this._symbolsTrainingTask.stopStatusPoller();
    this.autoSaver.destroy();
    this._subscription.unsubscribe();
  }

  ngOnInit() {
    this.editorService.load(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
    this._subscription.add(this.route.paramMap.subscribe(params => {
      this.editorService.select(params.get('book_id'), params.get('page_id'));
    }));

    this._subscription.add(this.toolbarStateService.runStaffDetection.subscribe(() => this.openStaffDetectionDialog()));
    this._subscription.add(this.toolbarStateService.runSymbolDetection.subscribe(() => this.openSymbolDetectionDialog()));
    this._subscription.add(this.toolbarStateService.runSymbolTraining.subscribe(() => this.openSymbolTrainerDialog()));
    this._subscription.add(this.toolbarStateService.runLayoutAnalysis.subscribe(() => this.openLayoutAnalysisDialog()));
    this._subscription.add(this.editorService.pageStateObs.subscribe(() => {  this.changeDetector.markForCheck(); }));
    this._subscription.add(this.editorService.pageStateObs.subscribe(page => {
      if (this._symbolsTrainingTask) { this._symbolsTrainingTask.stopStatusPoller(); this._symbolsTrainingTask = null; }
      if (!page.zero) {
        this._symbolsTrainingTask = new TaskPoller('train_symbols', this.http, page, 1000);
        if (this.serverState.isConnectedToServer) {
          this._symbolsTrainingTask.startStatusPoller();
        }
      }
    }));
    this._subscription.add(this.serverState.connectedToServer.subscribe(() => {
      if (this._symbolsTrainingTask) { this._symbolsTrainingTask.startStatusPoller(); }
    }));
    this._subscription.add(this.serverState.disconnectedFromServer.subscribe(() => {
      if (this._symbolsTrainingTask) { this._symbolsTrainingTask.stopStatusPoller(); }
    }));
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.editorService.actionStatistics.tick();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.code === 'KeyZ' && event.ctrlKey) {
      this.sheetOverlayComponent.toIdle();
      if (event.shiftKey) {
        this.actions.redo();
      } else {
        this.actions.undo();
      }
      event.preventDefault();
    }
  }

  private openStaffDetectionDialog() {
    const state = this.editorService.pageStateVal;
    if (!state) { return; }

    this.modalDialog.open(DetectStaffLinesDialogComponent, {
      width: '300px',
      data: {
        pageState: state,
        onClosed: () => this.editorService.staffDetectionFinished.emit(state),
      }
    });
  }

  private openSymbolDetectionDialog() {
    this.editorService.save((state) => {
      if (!state) { return; }

      this.modalDialog.open(DetectSymbolsDialogComponent, {
        width: '300px',
        data: {
          pageState: state,
          onClosed: () => this.editorService.symbolDetectionFinished.emit(state),
        }
      });
    });
  }

  private openSymbolTrainerDialog() {
    this.editorService.save((state) => {
      if (!state) { return; }

      this.modalDialog.open(TrainSymbolsDialogComponent, {
        width: '300px',
        data: {
          pageState: state,
          onClosed: () => {
          },
        }
      });
    });
  }

  private openLayoutAnalysisDialog() {
    this.editorService.save( state => {
      if (!state) { return; }

      this.modalDialog.open(LayoutAnalysisDialogComponent, {
        width: '300px',
        data: {
          pageState: state,
          onClosed: () => { this.editorService.layoutAnalysisFinished.emit(state); },
        }
      });
    });
  }
}
