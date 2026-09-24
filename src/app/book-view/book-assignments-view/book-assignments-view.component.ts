import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {BehaviorSubject, Subscription, timer} from 'rxjs';
import {exhaustMap, filter, takeWhile} from 'rxjs/operators';
import {BookCommunication} from '../../data-types/communication';
import {RestAPIUser} from '../../authentication/user';
import {ServerUrls} from '../../server-urls';
import {BookPermissionFlag, BookPermissionFlags} from '../../data-types/permissions';
import {
  compactRanges,
  PageAssignment,
  PageAssignmentsIndex,
  PageEditingUser,
  userColor,
  userInitials,
  userLabel,
} from '../../data-types/page-assignments';
import {PageAssignmentsService} from '../../page-assignments.service';
import {AuthenticationService} from '../../authentication/authentication.service';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../utils/api-error';
import {TaskProgressCodes, TaskStatus, TaskStatusCodes, queuedProgressLabel} from '../../editor/task';
import {EditAssignmentDialogComponent} from './edit-assignment-dialog/edit-assignment-dialog.component';
import {
  ConfirmDeleteAssignmentDialogComponent
} from './confirm-delete-assignment-dialog/confirm-delete-assignment-dialog.component';

@Component({
    selector: 'app-book-assignments-view',
    templateUrl: './book-assignments-view.component.html',
    styleUrls: ['./book-assignments-view.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class BookAssignmentsViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private changeDetector = inject(ChangeDetectorRef);
  private modalDialog = inject(MatDialog);
  private assignmentsService = inject(PageAssignmentsService);
  private auth = inject(AuthenticationService);

  // the tab is recreated on every switch, so every subscription must be released
  private readonly subscriptions = new Subscription();
  private pollSubscription: Subscription = null;
  private batchPollSubscription: Subscription = null;
  private batchLookupSubscription: Subscription = null;
  private batchResumedBook: string = null;
  private usersRequested = false;
  private resumedBook: string = null;
  readonly book = new BehaviorSubject<BookCommunication>(undefined);
  readonly displayedColumns = ['user', 'pages', 'progress', 'editing', 'note', 'updated', 'actions'];
  readonly editingColumns = ['page', 'user', 'since', 'assigned'];

  index: PageAssignmentsIndex = null;
  apiError: ApiError = null;
  suggestedError: ApiError = null;
  suggestedCount = 10;
  rangeFrom: string = null;
  rangeTo: string = null;
  suggestedLoading = false;
  suggestedStatus: TaskStatus = null;
  suggestedPages: string[] = null;
  batchUsers: RestAPIUser[] = [];
  batchUsernames: string[] = [];
  batchCount = 2;
  batchRangeFrom: string = null;
  batchRangeTo: string = null;
  batchLoading = false;
  batchDiscovering = false;
  batchStatus: TaskStatus = null;
  batchAssignments: PageAssignment[] = null;
  batchError: ApiError = null;

  readonly userColor = userColor;
  readonly userInitials = userInitials;
  readonly userLabel = userLabel;

  ngOnInit() {
    this.subscriptions.add(this.book.pipe(filter(b => !!b && !!b.book)).subscribe(book => {
      this.pollSubscription?.unsubscribe();
      this.batchPollSubscription?.unsubscribe();
      this.batchLookupSubscription?.unsubscribe();
      this.batchDiscovering = false;
      this.batchLoading = false;
      this.batchStatus = null;
      this.batchAssignments = null;
      this.batchError = null;
      this.batchUsernames = [];
      this.batchRangeFrom = null;
      this.batchRangeTo = null;
      this.batchResumedBook = null;
      this.suggestedLoading = false;
      this.suggestedStatus = null;
      this.suggestedPages = null;
      this.suggestedError = null;
      this.rangeFrom = null;
      this.rangeTo = null;
      this.resumedBook = null;
      this.assignmentsService.selectOrRefresh(book, true);   // overview wants fresh progress
      this.changeDetector.markForCheck();
    }));
    this.subscriptions.add(this.assignmentsService.stateObs.subscribe(index => {
      this.index = index;
      const book = this.book.getValue();
      if (index && book?.book && this.assignmentsService.book?.equals(book)) {
        const order = index.pageOrder;
        if (!order.includes(this.rangeFrom)) { this.rangeFrom = order[0] ?? null; }
        if (!order.includes(this.rangeTo)) { this.rangeTo = order[order.length - 1] ?? null; }
        if (!order.includes(this.batchRangeFrom)) { this.batchRangeFrom = order[0] ?? null; }
        if (!order.includes(this.batchRangeTo)) { this.batchRangeTo = order[order.length - 1] ?? null; }
      }
      if (this.maySelfAssign && book?.book && this.resumedBook !== book.book
          && this.assignmentsService.book?.equals(book)) {
        this.resumedBook = book.book;
        this.subscriptions.add(this.assignmentsService.suggestedTask(book).subscribe({
          next: response => {
            if (response.task_id && this.book.getValue()?.equals(book)) {
              this.pollSuggested(book, response.task_id);
            }
          },
          error: error => this.suggestedFailure(error, book),
        }));
      }
      if (this.mayEdit && book?.book && this.assignmentsService.book?.equals(book)) {
        if (!this.usersRequested) {
          this.usersRequested = true;
          this.subscriptions.add(this.http.get<{users: RestAPIUser[]}>(ServerUrls.auth('users')).subscribe({
            next: response => {
              this.batchUsers = response.users;
              this.changeDetector.markForCheck();
            },
            error: error => {
              this.usersRequested = false;
              if (this.book.getValue()?.equals(book)) {
                this.batchError = apiErrorFromHttpErrorResponse(error);
                this.changeDetector.markForCheck();
              }
            },
          }));
        }
        if (this.batchResumedBook !== book.book) {
          this.batchResumedBook = book.book;
          this.batchDiscovering = true;
          this.batchLookupSubscription = this.assignmentsService.suggestedBatchTask(book).subscribe({
            next: response => {
              if (!this.book.getValue()?.equals(book)) { return; }
              this.batchDiscovering = false;
              if (response.task_id) {
                this.pollSuggestedBatch(book, response.task_id);
              }
              this.changeDetector.markForCheck();
            },
            error: error => {
              this.batchDiscovering = false;
              this.batchFailure(error, book);
            },
          });
        }
      }
      this.changeDetector.markForCheck();
    }));
    this.subscriptions.add(this.assignmentsService.errorObs.subscribe(error => {
      this.apiError = error;
      this.changeDetector.markForCheck();
    }));
    this.subscriptions.add(this.route.paramMap.subscribe(
      (params: ParamMap) => this.book.next(new BookCommunication(params.get('book_id')))));
  }

  ngOnDestroy() {
    this.pollSubscription?.unsubscribe();
    this.batchPollSubscription?.unsubscribe();
    this.batchLookupSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  get assignments(): PageAssignment[] { return this.index ? this.index.assignments : []; }
  get pageOrder(): string[] { return this.index ? this.index.pageOrder : []; }
  get totalPages() { return this.index ? this.index.response.totalPages : 0; }
  get assignedPages() { return this.index ? this.index.response.assignedPages : 0; }
  get unassignedPages() { return Math.max(0, this.totalPages - this.assignedPages); }
  get multiAssignedPages() { return this.index ? this.index.multiAssignedPageCount : 0; }
  get assigneeCount() {
    return new Set(this.assignments.map(a => a.user.username)).size;
  }
  get mayEdit() {
    return !!this.index
      && new BookPermissionFlags(this.index.response.permissions).has(BookPermissionFlag.EditPermissions);
  }
  get maySelfAssign() {
    return !!this.auth.username && !!this.index
      && new BookPermissionFlags(this.index.response.permissions).has(BookPermissionFlag.ReadWrite);
  }

  get suggestedRangeSize(): number {
    const from = this.pageOrder.indexOf(this.rangeFrom);
    const to = this.pageOrder.indexOf(this.rangeTo);
    return from < 0 || to < 0 ? 0 : Math.abs(to - from) + 1;
  }

  get suggestedCountInvalid() {
    return !Number.isInteger(this.suggestedCount) || this.suggestedCount < 1
      || this.suggestedCount > this.suggestedRangeSize;
  }
  get batchRangeSize(): number {
    const from = this.pageOrder.indexOf(this.batchRangeFrom);
    const to = this.pageOrder.indexOf(this.batchRangeTo);
    return from < 0 || to < 0 ? 0 : Math.abs(to - from) + 1;
  }

  get batchCountInvalid() {
    return !Number.isInteger(this.batchCount) || this.batchCount < 1
      || this.batchCount * this.batchUsernames.length > this.batchRangeSize;
  }

  requestSuggestedBatch() {
    const book = this.book.getValue();
    if (!book?.book || !this.mayEdit || !this.batchUsernames.length || this.batchCountInvalid
        || !this.unassignedPages || this.batchLoading || this.batchDiscovering
        || new Set(this.batchUsernames).size !== this.batchUsernames.length
        || this.batchUsernames.some(username => !this.batchUsers.some(user => user.username === username))) { return; }
    this.batchLoading = true;
    this.batchError = null;
    this.batchAssignments = null;
    this.changeDetector.markForCheck();
    this.subscriptions.add(this.assignmentsService.requestSuggestedBatch(
      book, this.batchUsernames, this.batchCount, this.batchRangeFrom, this.batchRangeTo)
      .subscribe({
        next: response => {
          if (this.book.getValue()?.equals(book)) { this.pollSuggestedBatch(book, response.task_id); }
        },
        error: error => this.batchFailure(error, book),
      }));
  }

  private pollSuggestedBatch(book: BookCommunication, taskId: string) {
    this.batchPollSubscription?.unsubscribe();
    this.batchLoading = true;
    this.batchPollSubscription = timer(0, 1000).pipe(
      exhaustMap(() => this.assignmentsService.suggestedBatchTaskStatus(book, taskId)),
      takeWhile(response => response.status.code !== TaskStatusCodes.Finished, true),
    ).subscribe({
      next: response => {
        if (!this.book.getValue()?.equals(book)) { return; }
        this.batchStatus = response.status;
        if (response.assignments) {
          this.batchAssignments = response.assignments;
          this.batchLoading = false;
          if (this.assignmentsService.book?.equals(book)) {
            this.assignmentsService.reload();
          }
        }
        this.changeDetector.markForCheck();
      },
      error: error => this.batchFailure(error, book),
    });
    this.changeDetector.markForCheck();
  }

  get batchProgressLabel(): string { return this.taskProgressLabel(this.batchStatus); }

  private batchFailure(error: HttpErrorResponse, book: BookCommunication) {
    if (!this.book.getValue()?.equals(book)) { return; }
    this.batchLoading = false;
    this.batchStatus = null;
    this.batchError = apiErrorFromHttpErrorResponse(error);
    this.changeDetector.markForCheck();
  }


  requestSuggested() {
    const book = this.book.getValue();
    if (!book?.book || !this.maySelfAssign || this.suggestedCountInvalid || !this.unassignedPages
        || this.suggestedLoading) { return; }
    this.suggestedLoading = true;
    this.suggestedError = null;
    this.suggestedPages = null;
    this.changeDetector.markForCheck();
    this.subscriptions.add(this.assignmentsService.requestSuggestedAssignment(
      book, this.suggestedCount, this.rangeFrom, this.rangeTo)
      .subscribe({
        next: response => {
          if (this.book.getValue()?.equals(book)) { this.pollSuggested(book, response.task_id); }
        },
        error: error => this.suggestedFailure(error, book),
      }));
  }

  private pollSuggested(book: BookCommunication, taskId: string) {
    this.pollSubscription?.unsubscribe();
    this.suggestedLoading = true;
    this.pollSubscription = timer(0, 1000).pipe(
      exhaustMap(() => this.assignmentsService.suggestedTaskStatus(book, taskId)),
      takeWhile(response => response.status.code !== TaskStatusCodes.Finished, true),
    ).subscribe({
      next: response => {
        if (!this.book.getValue()?.equals(book)) { return; }
        this.suggestedStatus = response.status;
        if (response.assignment) {
          this.suggestedPages = response.assignment.pages;
          this.suggestedLoading = false;
          if (this.assignmentsService.book?.equals(book)) {
            this.assignmentsService.reload();
          }
        }
        this.changeDetector.markForCheck();
      },
      error: error => this.suggestedFailure(error, book),
    });
    this.changeDetector.markForCheck();
  }

  get suggestedProgressLabel(): string {
    return this.taskProgressLabel(this.suggestedStatus);
  }

  private taskProgressLabel(status: TaskStatus): string {
    if (!status) { return $localize`Starting suggested assignment…`; }
    if (status.code === TaskStatusCodes.Queued) {
      return queuedProgressLabel(status);
    }
    if (status.progress_code === TaskProgressCodes.WORKING) {
      return $localize`Embedding images: ${status.n_processed} of ${status.n_total}`;
    }
    return $localize`Loading the image model and selecting pages…`;
  }

  private suggestedFailure(error: HttpErrorResponse, book: BookCommunication) {
    if (!this.book.getValue()?.equals(book)) { return; }
    this.suggestedLoading = false;
    this.suggestedStatus = null;
    this.suggestedError = apiErrorFromHttpErrorResponse(error);
    this.changeDetector.markForCheck();
  }

  /** Live edit locks of the whole book, in page order -- shown even when nothing is assigned. */
  get currentlyEditing(): PageEditingUser[] {
    if (!this.index) { return []; }
    const order = new Map<string, number>();
    this.pageOrder.forEach((p, i) => order.set(p, i));
    return this.index.response.currentlyEditing.slice().sort(
      (a, b) => (order.get(a.page) ?? this.pageOrder.length) - (order.get(b.page) ?? this.pageOrder.length));
  }

  assigneesOfPage(page: string): string {
    if (!this.index) { return ''; }
    return this.index.forPage(page).map(a => userLabel(a.user)).join(', ');
  }

  /** Somebody editing a page that is not assigned to them -- the conflict an admin looks for. */
  editsForeignPage(editing: PageEditingUser): boolean {
    return !!this.index && !this.index.isAssignedTo(editing.page, editing.user.username);
  }

  isMine(assignment: PageAssignment) { return assignment.user.username === this.auth.username; }
  pageRange(assignment: PageAssignment) { return compactRanges(assignment.pages, this.pageOrder); }
  allPages(assignment: PageAssignment) { return assignment.pages.join(', '); }

  progressValue(assignment: PageAssignment) {
    const progress = assignment.progress;
    return progress.existing > 0 ? 100 * progress.finished / progress.existing : 0;
  }

  /** Who has one of this assignment's pages open right now. */
  editorsOf(assignment: PageAssignment): PageEditingUser[] {
    if (!this.index) { return []; }
    const pages = new Set(assignment.pages);
    return this.index.response.currentlyEditing.filter(e => pages.has(e.page));
  }

  isForeignEditor(assignment: PageAssignment, editing: PageEditingUser) {
    return editing.user.username !== assignment.user.username;
  }

  /** Who has a page open changes by the minute, so the panel offers an explicit refresh. */
  refresh() { this.assignmentsService.reload(); }

  newAssignment() { this.openDialog(null); }
  editAssignment(assignment: PageAssignment) { this.openDialog(assignment); }

  private openDialog(assignment: PageAssignment) {
    this.modalDialog.open(EditAssignmentDialogComponent, {
      width: '720px',
      data: {book: this.book.getValue(), pageOrder: this.pageOrder, assignment},
    }).afterClosed().subscribe(saved => {
      if (saved) { this.assignmentsService.reload(); }
    });
  }

  deleteAssignment(assignment: PageAssignment) {
    this.modalDialog.open(ConfirmDeleteAssignmentDialogComponent, {
      data: {book: this.book.getValue(), assignment, pageRange: this.pageRange(assignment)},
    }).afterClosed().subscribe(deleted => {
      if (deleted) { this.assignmentsService.reload(); }
    });
  }
}
