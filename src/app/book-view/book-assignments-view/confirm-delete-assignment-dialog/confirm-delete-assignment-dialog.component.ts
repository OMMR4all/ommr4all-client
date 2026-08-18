import {Component, inject} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BookCommunication} from '../../../data-types/communication';
import {PageAssignment, userLabel} from '../../../data-types/page-assignments';
import {ApiError} from '../../../utils/api-error';

export interface DeleteAssignmentData {
  book: BookCommunication;
  assignment: PageAssignment;
  pageRange: string;
}

@Component({
    selector: 'app-confirm-delete-assignment-dialog',
    templateUrl: './confirm-delete-assignment-dialog.component.html',
    standalone: false
})
export class ConfirmDeleteAssignmentDialogComponent {
  private http = inject(HttpClient);
  private dialogRef = inject<MatDialogRef<ConfirmDeleteAssignmentDialogComponent>>(MatDialogRef);
  data = inject<DeleteAssignmentData>(MAT_DIALOG_DATA);

  errorMessage = '';
  readonly userLabel = userLabel;

  close(result: boolean) { this.dialogRef.close(result); }

  onConfirm() {
    this.http.delete(this.data.book.assignmentUrl(this.data.assignment.id)).subscribe(
      () => this.close(true),
      (err: HttpErrorResponse) => {
        this.errorMessage = err.error ? (err.error as ApiError).userMessage : err.message;
      },
    );
  }
}
