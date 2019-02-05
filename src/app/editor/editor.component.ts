import {ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {EditorTools, PrimaryViews, ToolBarStateService} from './tool-bar/tool-bar-state.service';
import {EditorService} from './editor.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SheetOverlayComponent} from './sheet-overlay/sheet-overlay.component';
import {ActionsService} from './actions/actions.service';
import {ModalDialogService} from 'ngx-modal-dialog';
import {DetectStaffLinesDialogComponent} from './dialogs/detect-stafflines-dialog/detect-stafflines-dialog.component';
import {DetectSymbolsDialogComponent} from './dialogs/detect-symbols-dialog/detect-symbols-dialog.component';
import {TrainSymbolsDialogComponent} from './dialogs/train-symbols-dialog/train-symbols-dialog.component';
import {AutoSaver} from './auto-saver';
import {ServerStateService} from '../server-state/server-state.service';
import {LayoutAnalysisDialogComponent} from './dialogs/layout-analysis-dialog/layout-analysis-dialog.component';
import {NotePropertyWidgetComponent} from './property-widgets/note-property-widget/note-property-widget.component';
import {PropertyWidgets} from './property-widgets/definitions';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class EditorComponent implements OnInit, OnDestroy {
  @ViewChild(SheetOverlayComponent) sheetOverlayComponent: SheetOverlayComponent;
  @ViewChild(NotePropertyWidgetComponent) notePropertyWidget: NotePropertyWidgetComponent;

  PrimaryViews = PrimaryViews;
  ET = EditorTools;

  public autoSaver: AutoSaver;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private actions: ActionsService,
    private serverState: ServerStateService,
    public editorService: EditorService,
    private modalService: ModalDialogService,
    private viewRef: ViewContainerRef,
    public toolbarStateService: ToolBarStateService) {
    this.autoSaver = new AutoSaver(actions, editorService, serverState);
    this.editorService.currentPageChanged.subscribe(() => {
      this.autoSaver.destroy();
      this.autoSaver = new AutoSaver(actions, editorService, serverState);
    });
  }

  ngOnDestroy(): void {
    this.autoSaver.destroy();
  }

  ngOnInit() {
    this.editorService.load(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
    this.route.paramMap.subscribe(params => {
      this.editorService.select(params.get('book_id'), params.get('page_id'));
    });

    this.toolbarStateService.runStaffDetection.subscribe(() => this.openStaffDetectionDialog());
    this.toolbarStateService.runSymbolDetection.subscribe(() => this.openSymbolDetectionDialog());
    this.toolbarStateService.runSymbolTraining.subscribe(() => this.openSymbolTrainerDialog());
    this.toolbarStateService.runLayoutAnalysis.subscribe(() => this.openLayoutAnalysisDialog());
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

    this.modalService.openDialog(this.viewRef, {
      title: 'Detect staff lines',
      childComponent: DetectStaffLinesDialogComponent,
      data: {
        pageState: state,
        onClosed: () => this.editorService.staffDetectionFinished.emit(state),
      }
    });
  }

  private openSymbolDetectionDialog() {
    this.editorService.save((state) => {
      if (!state) { return; }

      this.modalService.openDialog(this.viewRef, {
        title: 'Detect symbols',
        childComponent: DetectSymbolsDialogComponent,
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

      this.modalService.openDialog(this.viewRef, {
        title: 'Train symbols',
        childComponent: TrainSymbolsDialogComponent,
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

      this.modalService.openDialog(this.viewRef, {
        title: 'Layout analysis',
        childComponent: LayoutAnalysisDialogComponent,
        data: {
          pageState: state,
          onClosed: () => { this.editorService.layoutAnalysisFinished.emit(state); },
        }
      });
    });
  }

  get propertyWidgets(): PropertyWidgets {
    return new PropertyWidgets(this.notePropertyWidget);
  }
}
