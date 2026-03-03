import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ConfirmDialogModel} from '../../../editor/dialogs/workflow-finish-dialog/workflow-finish-dialog.component';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../utils/api-error';
import {AuthenticatedUser} from '../../../authentication/user';
import {map, shareReplay} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-monodi-login-dialog',
    templateUrl: './monodi-login-dialog.component.html',
    styleUrls: ['./monodi-login-dialog.component.scss'],
    standalone: false
})
export class MonodiLoginDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<MonodiLoginDialogComponent>>(MatDialogRef);
  private fb = inject(UntypedFormBuilder);
  private http = inject(HttpClient);

  form: UntypedFormGroup;
  apiError: ApiError;
  constructor() {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onView(): void {
    // Close the dialog, return true
    this.dialogRef.close('view');
  }

  onEdit(): void {
    // Close the dialog, return false
    this.dialogRef.close('edit');
  }

  ngOnInit(): void {
  }
  onCancel() {
    this.dialogRef.close('cancel');

  }

  login() {
    const val = this.form.value;
    if (val.username && val.password) {
      const username = val.username;
      const password = val.password;
      this.http.post('/api/monodi/login/', {username, password}).subscribe(
        (next) => {
          this.dialogRef.close('successfullyLoggedIn');
        },
        (errors) => {
          this.apiError = apiErrorFromHttpErrorResponse(errors);
        });
    }
  }
}


