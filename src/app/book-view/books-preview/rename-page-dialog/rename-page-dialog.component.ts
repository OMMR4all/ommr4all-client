import {Component, Inject, OnInit} from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {PageCommunication} from '../../../data-types/communication';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BookMeta} from '../../../book-list.service';
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ApiError} from '../../../utils/api-error';

export interface PageData {
  name: string;
  pageCom: PageCommunication;
}

export class RenameErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-rename-page-dialog',
  templateUrl: './rename-page-dialog.component.html',
  styleUrls: ['./rename-page-dialog.component.css']
})
export class RenamePageDialogComponent implements OnInit {
  public nameFormControl: FormControl;
  public title = '';
  public errorMessage = '';
  matcher = new RenameErrorStateMatcher();

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<RenamePageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PageData,
  ) {
    this.title = data.name;
    this.nameFormControl = new FormControl(data.name, [
      Validators.pattern(/^\w+$/)
    ]);
  }

  ngOnInit() {
  }

  close(result: boolean|string) { this.dialogRef.close(result); }

  onConfirm() {
    this.http.post(this.data.pageCom.rename_url(), {'name': this.nameFormControl.value}).subscribe(
      () => {
        this.close(this.nameFormControl.value);
      },
      (err: HttpErrorResponse) => {
        if (err.error) {
          const error = err.error as ApiError;
          this.errorMessage = error.userMessage;
        } else {
          this.errorMessage = err.message;
        }
      }
    );
  }

}
