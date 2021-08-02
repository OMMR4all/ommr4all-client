import {Component, Inject, OnInit} from '@angular/core';
import {ServerUrls} from '../../../server-urls';
import {HttpClient} from '@angular/common/http';
import {BookMeta} from '../../../book-list.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../utils/api-error';

export interface DeleteBookData {
  book: BookMeta;
}

@Component({
  selector: 'app-confirm-delete-book-dialog',
  templateUrl: './confirm-delete-book-dialog.component.html',
  styleUrls: ['./confirm-delete-book-dialog.component.css']
})
export class ConfirmDeleteBookDialogComponent implements OnInit {
  public apiError: ApiError;

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<ConfirmDeleteBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteBookData,
  ) {
  }

  ngOnInit() {
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }

  cancel() {
    this.close(false);
  }

  onConfirm() {
    (new Promise(((resolve, reject) => {
      this.http.delete(ServerUrls.deleteBook(this.data.book.id)).subscribe(
        next => {
          resolve();
        },
        error => {
          this.apiError = apiErrorFromHttpErrorResponse(error);
          reject();
        }
      );
    }))).then(
      () => this.close(true)
    ).catch(() => {});
  }
}
