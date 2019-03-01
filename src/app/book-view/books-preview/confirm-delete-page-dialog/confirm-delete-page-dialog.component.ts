import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {forkJoin} from 'rxjs';
import {PageCommunication} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import {HttpClient} from '@angular/common/http';

export interface BookData {
  page: PageCommunication;
  book: BookMeta;
}

@Component({
  selector: 'app-confirm-delete-page-dialog',
  templateUrl: './confirm-delete-page-dialog.component.html',
  styleUrls: ['./confirm-delete-page-dialog.component.css']
})
export class ConfirmDeletePageDialogComponent implements OnInit {
  public errorMessage = '';

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<ConfirmDeletePageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookData,
  ) {
  }

  ngOnInit() {
  }

  close(result: boolean) { this.dialogRef.close(result); }

  onConfirm() {
    this.http.delete(this.data.page.operation_url('delete')).subscribe(
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
