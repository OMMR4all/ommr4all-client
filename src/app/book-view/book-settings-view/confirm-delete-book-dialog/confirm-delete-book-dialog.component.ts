import {Component, Inject, OnInit} from '@angular/core';
import {ServerUrls} from '../../../server-urls';
import {HttpClient} from '@angular/common/http';
import {BookMeta} from '../../../book-list.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

export interface DeleteBookData {
  book: BookMeta;
}

@Component({
  selector: 'app-confirm-delete-book-dialog',
  templateUrl: './confirm-delete-book-dialog.component.html',
  styleUrls: ['./confirm-delete-book-dialog.component.css']
})
export class ConfirmDeleteBookDialogComponent implements OnInit {
  public errorMessage = '';

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
          const resp = error as Response;
          if (resp.status === 304) {
            this.errorMessage = 'The book could not be deleted.';
          } else if (resp.status === 504) {
            this.errorMessage = 'Server is unavailable.';
          } else {
            this.errorMessage = 'Unknown server error (' + resp.status + ').';
          }
          reject();
        }
      );
    }))).then(
      () => this.close(true)
    ).catch(() => {});
  }
}
