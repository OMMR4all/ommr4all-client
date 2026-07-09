import {Component, Input, OnDestroy, OnInit, inject} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {AlgorithmTypes} from '../algorithm-predictor-params';
import {BookCommunication, PageResponse} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import {PageCount, PageSelection} from '../page-selection';
import { HttpClient } from '@angular/common/http';
import {ConfirmDialogModel} from '../../../common/confirm-dialog/confirm-dialog.component';
import {WorkflowFinishDialogComponent} from '../../../editor/dialogs/workflow-finish-dialog/workflow-finish-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {Router} from '@angular/router';
import {OneClickWorkflowConfig, validateWorkflow, WorkflowValidationResult} from './workflow-config';
import {WorkflowRunner} from './workflow-runner';

@Component({
    selector: 'app-one-click-workflow',
    templateUrl: './one-click-workflow.component.html',
    styleUrls: ['./one-click-workflow.component.scss'],
    standalone: false
})
export class OneClickWorkflowComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;

  pageSelectionAlgorithm = AlgorithmTypes.Preprocessing;
  selection: PageSelection = {
    count: PageCount.Unprocessed,
    pages: [],
    selected_pages_range_as_regex: '',
  };

  config: OneClickWorkflowConfig;
  runner: WorkflowRunner;

  private readonly saveRequest = new Subject<void>();
  private readonly subscriptions = new Subscription();

  ngOnInit() {
    this.config = OneClickWorkflowConfig.fromJson(this.bookMeta.oneClickWorkflow)
      || OneClickWorkflowConfig.defaultConfig(this.bookMeta);
    this.runner = new WorkflowRunner(this.http, this.book);
    this.subscriptions.add(this.runner.finished.subscribe(r => this.finishedWorkflow(r)));
    this.subscriptions.add(this.saveRequest.pipe(debounceTime(500)).subscribe(() => this.saveMeta()));
  }

  ngOnDestroy(): void {
    // running server tasks are intentionally not cancelled (as before)
    this.subscriptions.unsubscribe();
  }

  get validation(): WorkflowValidationResult { return validateWorkflow(this.config.steps); }

  onConfigChange() {
    this.bookMeta.oneClickWorkflow = this.config.toJson();
    this.saveRequest.next();
  }

  private saveMeta() {
    // saveMeta is a no-op without the EditBookMeta permission
    this.book.saveMeta(this.http, this.bookMeta).subscribe();
  }

  run() {
    this.runner.run(this.config, this.selection);
  }

  finishedWorkflow($event: boolean) {
    if ($event === true) {
      const message = 'The automatic pipeline has finished. Do you want to switch the view?';
      const dialogData = new ConfirmDialogModel('Process Finished', message);
      const dialogRef = this.dialog.open(WorkflowFinishDialogComponent, {
        maxWidth: '400px',
        data: dialogData
      });
      dialogRef.afterClosed().subscribe(confirmed => {
        let firstPage: string;
        this.http.get<{ pages: PageResponse[], totalPages: number }>(this.book.listPages(), {}).toPromise().then(
          r => {
            firstPage = r.pages[0].label;
            if (confirmed === 'edit') {

              this.router.navigate(['book', this.book.book, 'page', firstPage, 'edit']);

            }
            if ((confirmed === 'view')) {
              this.router.navigate(['book', this.book.book, 'page', firstPage, 'view']);

            }
          },
          () => undefined
        );

      });

    }
  }
}
