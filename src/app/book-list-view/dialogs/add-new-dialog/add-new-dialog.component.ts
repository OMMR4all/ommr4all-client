import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ServerUrls} from '../../../server-urls';
import {HttpClient} from '@angular/common/http';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

export interface NewDialogData {
  bookName: string;
}

@Component({
  selector: 'app-add-new-dialog',
  templateUrl: './add-new-dialog.component.html',
  styleUrls: ['./add-new-dialog.component.css']
})
export class AddNewDialogComponent implements OnInit, OnDestroy {
  errorMessage: string;

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<AddNewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewDialogData,
    ) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }

  add() {
    if (this.data.bookName.length === 0) {
      this.errorMessage = 'An empty book name is not allowed';
      return;
    }
    (new Promise(((resolve, reject) => {
      this.http.put(ServerUrls.addBook(), {'name': this.data.bookName}).subscribe(
        book => {
          resolve();
        },
        error => {
          const resp = error as Response;
          if (resp.status === 304) {
            this.errorMessage = 'A book with this name already exists.';
          } else if (resp.status === 504) {
            this.errorMessage = 'Server is unavailable.';
          } else if (resp.status === 460 || resp.status === 406) {
            this.errorMessage = 'Invalid name.';
          } else {
            this.errorMessage = 'Unknown server error (' + resp.status + ').';
          }
          reject();
        }
      );
    }))).then(
      () => { this.close(true); }
    ).catch(() => {});
  }
}
