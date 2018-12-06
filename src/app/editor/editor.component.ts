import {ChangeDetectionStrategy, Component, HostListener, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {PrimaryViews, ToolBarStateService} from './tool-bar/tool-bar-state.service';
import {EditorService} from './editor.service';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {SheetOverlayComponent} from './sheet-overlay/sheet-overlay.component';
import {ActionsService} from './actions/actions.service';
import {ModalDialogService} from 'ngx-modal-dialog';
import {DetectStaffLinesDialogComponent} from './dialogs/detect-stafflines-dialog/detect-stafflines-dialog.component';
import {DetectSymbolsDialogComponent} from './dialogs/detect-symbols-dialog/detect-symbols-dialog.component';
import {TrainSymbolsDialogComponent} from './dialogs/train-symbols-dialog/train-symbols-dialog.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class EditorComponent implements OnInit {
  @ViewChild(SheetOverlayComponent) sheetOverlayComponent: SheetOverlayComponent;
  PrimaryViews = PrimaryViews;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private actions: ActionsService,
    public editorService: EditorService,
    private modalService: ModalDialogService,
    private viewRef: ViewContainerRef,
    public toolbarStateService: ToolBarStateService) {}

  ngOnInit() {
    this.editorService.load(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.editorService.select(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
      }
    });

    this.toolbarStateService.runStaffDetection.subscribe(() => this.openStaffDetectionDialog());
    this.toolbarStateService.runSymbolDetection.subscribe(() => this.openSymbolDetectionDialog());
    this.toolbarStateService.runSymbolTraining.subscribe(() => this.openSymbolTrainerDialog());
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
    const state = this.editorService.pageStateVal;
    if (!state) { return; }

    this.modalService.openDialog(this.viewRef, {
      title: 'Train symbols',
      childComponent: TrainSymbolsDialogComponent,
      data: {
        pageState: state,
        onClosed: () => {},
      }
    });
  }
}
