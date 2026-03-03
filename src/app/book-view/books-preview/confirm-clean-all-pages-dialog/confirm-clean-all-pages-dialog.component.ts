import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    styleUrls: ['./confirm-clean-all-pages-dialog.component.css'],
    standalone: false
})
export class ConfirmCleanAllPagesDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject<MatDialogRef<ConfirmCleanAllPagesDialogComponent>>(MatDialogRef);
  data = inject<BookData>(MAT_DIALOG_DATA);

  public errorMessage = '';

  ngOnInit() {
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }

  onConfirm() {
    if (this.data.pages.length === 0) {
      this.close(true);
      return;
    }

    forkJoin(this.data.pages.map(page => this.http.delete(page.operationUrl('clean'))))
      .subscribe({
        next: () => {
          this.close(true);
        },
        error: (error: Response) => {
          if (error.status === 304) {
            this.errorMessage = 'The book could not be cleared.';
          } else if (error.status === 504) {
            this.errorMessage = 'Server is unavailable.';
          } else {
            this.errorMessage = 'Unknown server error (' + error.status + ').';
          }
        }
      });
  }
}
