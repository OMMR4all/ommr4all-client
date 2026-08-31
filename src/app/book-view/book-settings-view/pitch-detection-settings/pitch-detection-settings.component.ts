import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BookCommunication, PageCommunication} from '../../../data-types/communication';
import {PitchDetectionParams} from '../../../data-types/page/pitch-detection-params';
import {PagesPreviewService} from '../../../editor/pages-preview/pages-preview.service';
import {AlgorithmTypes} from '../../book-step/algorithm-predictor-params';
import {TaskWorker} from '../../../editor/task';
import {ConfirmDialogComponent, ConfirmDialogModel} from '../../../common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-pitch-detection-settings',
  templateUrl: './pitch-detection-settings.component.html',
  styleUrls: ['./pitch-detection-settings.component.scss'],
  standalone: false
})
export class PitchDetectionSettingsComponent implements OnInit, OnChanges {
  private http = inject(HttpClient);
  private pagesPreview = inject(PagesPreviewService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  /** Edit buffer of the book meta; changed in place, stored by the parent. */
  @Input() params: PitchDetectionParams;
  /** What the server currently has, to tell whether the values still need to be saved. */
  @Input() savedParams: PitchDetectionParams;
  @Input() bookCom: BookCommunication;
  /** True when a maintainer reserved the book wide runs of this book, see BookMeta.bookOperationsBlocked. */
  @Input() locked = false;

  @Output() save = new EventEmitter();

  pages: PageCommunication[] = [];
  selectedPage: PageCommunication = null;
  /** Clamped copy handed to the preview; a new object each time, so the preview picks it up. */
  previewParams = new PitchDetectionParams();

  applying = false;
  applyMessage = '';
  /** Kept while the task runs so the template can show its real per-page progress. */
  applyTask: TaskWorker = null;

  /** Whether the task has a status worth rendering; it is NotFound until the first poll. */
  get applyTaskStarted(): boolean {
    return !!this.applyTask && (this.applyTask.taskStatusQueued || this.applyTask.taskStatusRunning
      || this.applyTask.taskStatusFinished);
  }

  ngOnInit(): void {
    this.loadPages();
    this.onParamsChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bookCom']) { this.loadPages(); }
    if (changes['params']) { this.onParamsChange(); }
  }

  get unsavedChanges(): boolean {
    return !!this.params && !!this.savedParams && !this.params.equals(this.savedParams);
  }

  /** True while the requested values cannot be used as they are, see PitchDetectionParams.clamped. */
  get outOfRange(): boolean {
    return !!this.params && !this.params.clamped().equals(new PitchDetectionParams(
      this.params.toleranceTop, this.params.toleranceBottom, this.params.forceClefsOnLine));
  }

  onParamsChange() {
    if (!this.params) { return; }
    this.previewParams = this.params.clamped();
  }

  private loadPages() {
    if (!this.bookCom) { return; }
    this.pagesPreview.getPages(this.bookCom).subscribe(pages => {
      this.pages = pages;
      if (!this.selectedPage && pages.length > 0) { this.selectedPage = pages[0]; }
    });
  }

  comparePages(a: PageCommunication, b: PageCommunication) { return !!a && !!b && a.page === b.page; }

  applyToAllPages() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '480px',
      data: new ConfirmDialogModel(
        $localize`Apply to all pages`,
        $localize`The position in staff of every symbol of this book is derived again from the saved
tolerances. Pages whose symbols are locked or verified keep what they contain. This cannot be undone.`),
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) { this.runApply(); }
    });
  }

  private runApply() {
    this.applying = true;
    this.applyMessage = $localize`Deriving the positions in staff of all pages ...`;
    const task = new TaskWorker(AlgorithmTypes.ReapplyPositionInStaff, this.http, this.bookCom, {});
    this.applyTask = task;
    task.runToCompletion().then(
      (res: any) => {
        this.applying = false;
        this.applyMessage = '';
        this.applyTask = null;
        const updated = res && res.n_updated !== undefined ? res.n_updated : 0;
        const skipped = res && res.n_skipped !== undefined ? res.n_skipped : 0;
        this.snackBar.open(
          $localize`${updated} page(s) updated, ${skipped} locked page(s) skipped.`,
          $localize`:@@snackBarDismiss:Close`, {duration: 8000});
      },
      err => {
        this.applying = false;
        this.applyMessage = '';
        this.applyTask = null;
        this.snackBar.open(
          err && err.message ? err.message : $localize`The positions could not be derived again.`,
          $localize`:@@snackBarDismiss:Close`, {duration: 8000});
      },
    );
  }
}
