import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {BehaviorSubject, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {BookCommunication} from '../../data-types/communication';
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
import {ApiError} from '../../utils/api-error';
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
  private changeDetector = inject(ChangeDetectorRef);
  private modalDialog = inject(MatDialog);
  private assignmentsService = inject(PageAssignmentsService);
  private auth = inject(AuthenticationService);

  // the tab is recreated on every switch, so every subscription must be released
  private readonly subscriptions = new Subscription();
  readonly book = new BehaviorSubject<BookCommunication>(undefined);
  readonly displayedColumns = ['user', 'pages', 'progress', 'editing', 'note', 'updated', 'actions'];
  readonly editingColumns = ['page', 'user', 'since', 'assigned'];

  index: PageAssignmentsIndex = null;
  apiError: ApiError = null;

  readonly userColor = userColor;
  readonly userInitials = userInitials;
  readonly userLabel = userLabel;

  ngOnInit() {
    this.subscriptions.add(this.book.pipe(filter(b => !!b)).subscribe(book => {
      this.assignmentsService.selectOrRefresh(book, true);   // overview wants fresh progress
    }));
    this.subscriptions.add(this.assignmentsService.stateObs.subscribe(index => {
      this.index = index;
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
