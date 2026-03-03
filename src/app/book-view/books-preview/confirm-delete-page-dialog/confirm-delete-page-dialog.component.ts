import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {forkJoin, of} from 'rxjs';
import {PageCommunication} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import { HttpClient } from '@angular/common/http';
import {mergeMap} from 'rxjs/operators';

export interface BookData {
  pages: PageCommunication[];
  book: BookMeta;
}

@Component({
    selector: 'app-confirm-delete-page-dialog',
    templateUrl: './confirm-delete-page-dialog.component.html',
    styleUrls: ['./confirm-delete-page-dialog.component.css'],
    standalone: false
})
export class ConfirmDeletePageDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject<MatDialogRef<ConfirmDeletePageDialogComponent>>(MatDialogRef);
  data = inject<BookData>(MAT_DIALOG_DATA);

  public errorMessage = '';

  ngOnInit() {
  }

  close(result: boolean) { this.dialogRef.close(result); }

  onConfirm() {
    of(this.data.pages).pipe(mergeMap(pages => forkJoin(
      pages.map(page => this.http.delete(page.operationUrl('delete')))))).subscribe(
      next => { this.close(true); },
      error => {
        const resp = error as Response;
        if (resp.status === 304) {
          this.errorMessage = 'The book could not be deleted.';
        } else if (resp.status === 504) {
          this.errorMessage = 'Server is unavailable.';
        } else {
          this.errorMessage = 'Unknown server error (' + resp.status + ').';
        }
      }
    );
  }
}
