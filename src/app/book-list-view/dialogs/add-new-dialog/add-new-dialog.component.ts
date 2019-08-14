import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ServerUrls} from '../../../server-urls';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {ApiError} from '../../../utils/api-error';
import {FormControl, Validators} from '@angular/forms';

export interface NewDialogData {
  bookName: string;
}

@Component({
  selector: 'app-add-new-dialog',
  templateUrl: './add-new-dialog.component.html',
  styleUrls: ['./add-new-dialog.component.css']
})
export class AddNewDialogComponent implements OnInit, OnDestroy {
  apiError: ApiError;
  bookNameFormControl = new FormControl('', [
    Validators.required,
  ]);

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<AddNewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewDialogData,
    ) {
  }

  ngOnInit(): void {
    this.bookNameFormControl.setValue(this.data.bookName);
  }

  ngOnDestroy(): void {
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }

  add() {
    this.data.bookName = this.bookNameFormControl.value;
    if (this.data.bookName.length === 0) {
      return;
    }
    (new Promise(((resolve, reject) => {
      this.http.put(ServerUrls.addBook(), {name: this.data.bookName}).subscribe(
        book => {
          resolve();
        },
        error => {
          const resp = error as HttpErrorResponse;
          const apiError = resp.error as ApiError;
          if (apiError && apiError.errorCode) {
            this.apiError = apiError;
          } else {
            this.apiError = {
              status: error.status,
              developerMessage: 'Unknown server error.',
              userMessage: 'Unknown server error. Please contact the admininstrator.',
              errorCode: 1,
            };
          }
          reject();
        }
      );
    }))).then(
      () => { this.close(true); }
    ).catch(() => {});
  }
}
