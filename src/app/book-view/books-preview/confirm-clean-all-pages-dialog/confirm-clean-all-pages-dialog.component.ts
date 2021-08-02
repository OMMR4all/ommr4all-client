import {Component, Inject, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {PageCommunication} from '../../../data-types/communication';
import {forkJoin} from 'rxjs';
import {BookMeta} from '../../../book-list.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface BookData {
  pages: PageCommunication[];
  book: BookMeta;
}

@Component({
  selector: 'app-confirm-clean-all-pages-dialog',
  templateUrl: './confirm-clean-all-pages-dialog.component.html',
  styleUrls: ['./confirm-clean-all-pages-dialog.component.css']
})
export class ConfirmCleanAllPagesDialogComponent implements OnInit {
  public errorMessage = '';

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<ConfirmCleanAllPagesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookData,
  ) {
  }

  ngOnInit() {
  }

  close(result: boolean) { this.dialogRef.close(result); }

  onConfirm() {
    if (this.data.pages.length === 0) { this.close(true); }
    (new Promise(((resolve, reject) => {
      forkJoin(this.data.pages.map(page => this.http.delete(page.operationUrl('clean')))).subscribe(
        next => {
          resolve();
        },
        error => {
          const resp = error as Response;
          if (resp.status === 304) {
            this.errorMessage = 'The book could not be cleared.';
          } else if (resp.status === 504) {
            this.errorMessage = 'Server is unavailable.';
          } else {
            this.errorMessage = 'Unknown server error (' + resp.status + ').';
          }
          reject();
        }
      );
    }))).then(() => this.close(true)).catch(() => {});
  }

}
