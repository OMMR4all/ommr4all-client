import {Component, OnInit, inject} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BookCommunication} from '../../../data-types/communication';
import {RestAPIUser} from '../../../authentication/user';
import {ServerUrls} from '../../../server-urls';
import {ApiError} from '../../../utils/api-error';
import {
  compactRanges,
  expandRange,
  PageAssignment,
  parseRanges,
  userLabel,
} from '../../../data-types/page-assignments';

export interface EditAssignmentData {
  book: BookCommunication;
  pageOrder: string[];
  assignment?: PageAssignment;
}

@Component({
    selector: 'app-edit-assignment-dialog',
    templateUrl: './edit-assignment-dialog.component.html',
    styleUrls: ['./edit-assignment-dialog.component.css'],
    standalone: false
})
export class EditAssignmentDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject<MatDialogRef<EditAssignmentDialogComponent>>(MatDialogRef);
  data = inject<EditAssignmentData>(MAT_DIALOG_DATA);

  users: RestAPIUser[] = [];
  username = '';
  note = '';
  rangeFrom: string = null;
  rangeTo: string = null;
  /** the single source of truth for the selection; the text field is its compact form */
  pages: string[] = [];
  pagesText = '';
  unknownPages: string[] = [];
  errorMessage = '';
  saving = false;

  readonly userLabel = userLabel;

  get pageOrder() { return this.data.pageOrder; }
  get isNew() { return !this.data.assignment; }
  get canSave() {
    return !this.saving && this.username.length > 0 && this.pages.length > 0 && this.unknownPages.length === 0;
  }

  ngOnInit() {
    this.http.get<{users: RestAPIUser[]}>(ServerUrls.auth('users')).subscribe(
      res => this.users = res.users,
      err => this.errorMessage = err.message,
    );
    if (this.data.assignment) {
      this.username = this.data.assignment.user.username;
      this.note = this.data.assignment.note;
      this.setPages(this.data.assignment.pages);
    }
    this.rangeFrom = this.pageOrder.length > 0 ? this.pageOrder[0] : null;
    this.rangeTo = this.pageOrder.length > 0 ? this.pageOrder[this.pageOrder.length - 1] : null;
  }

  private setPages(pages: string[]) {
    const order = new Map<string, number>();
    this.pageOrder.forEach((p, i) => order.set(p, i));
    this.pages = Array.from(new Set(pages)).sort(
      (a, b) => (order.get(a) ?? this.pageOrder.length) - (order.get(b) ?? this.pageOrder.length));
    this.pagesText = compactRanges(this.pages, this.pageOrder);
    this.unknownPages = [];
  }

  addRange() {
    if (!this.rangeFrom || !this.rangeTo) { return; }
    this.setPages(this.pages.concat(expandRange(this.rangeFrom, this.rangeTo, this.pageOrder)));
  }

  clearPages() { this.setPages([]); }

  /** The text field stays authoritative while the user types: invalid labels are kept
   *  visible (and block saving) instead of being silently dropped. */
  pagesTextChanged(text: string) {
    this.pagesText = text;
    const parsed = parseRanges(text, this.pageOrder);
    this.pages = parsed.pages;
    this.unknownPages = parsed.unknown;
  }

  close(result: boolean) { this.dialogRef.close(result); }

  onConfirm() {
    this.saving = true;
    const body = {username: this.username, pages: this.pages, note: this.note};
    const call = this.isNew
      ? this.http.put(this.data.book.assignmentsUrl(), body)
      : this.http.post(this.data.book.assignmentUrl(this.data.assignment.id), body);
    call.subscribe(
      () => this.close(true),
      (err: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = err.error ? (err.error as ApiError).userMessage : err.message;
      },
    );
  }
}
