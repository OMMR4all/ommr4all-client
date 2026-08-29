import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '../authentication.service';
import { ApiError, apiErrorFromHttpErrorResponse, ErrorCodes } from '../../utils/api-error';

/**
 * Log in again without leaving the page.
 *
 * Navigating to /login on an expired session throws away everything the editor holds in
 * memory (the open page, the undo stack, unsaved changes). This dialog is opened by
 * AuthenticationService.recoverSession() instead; the request that hit the 401 is retried
 * by the ErrorInterceptor once it closes with `true`, so work simply continues.
 */
@Component({
    selector: 'app-session-expired-dialog',
    templateUrl: './session-expired-dialog.component.html',
    styleUrls: ['./session-expired-dialog.component.css'],
    standalone: false
})
export class SessionExpiredDialogComponent {
  private fb = inject(UntypedFormBuilder);
  private authService = inject(AuthenticationService);
  private dialogRef = inject<MatDialogRef<SessionExpiredDialogComponent>>(MatDialogRef);
  // handed in by AuthenticationService, which reads it before ending the session -- asking
  // the (already logged out) service for it here only ever produced an empty field
  private data = inject<{username?: string}>(MAT_DIALOG_DATA, {optional: true});

  form: UntypedFormGroup;
  apiError: ApiError = null;
  loggingIn = false;

  constructor() {
    this.form = this.fb.group({
      // the session that just expired knows whose it was; only the password is really asked for
      username: [this.data?.username || '', Validators.required],
      password: ['', Validators.required],
    });
  }

  login() {
    const val = this.form.value;
    if (!val.username || !val.password || this.loggingIn) { return; }
    this.loggingIn = true;
    this.authService.login(val.username, val.password).subscribe(
      () => this.dialogRef.close(true),
      (err: HttpErrorResponse) => {
        this.loggingIn = false;
        this.apiError = err.status === 400 || err.status === 401 ? {
          status: err.status,
          developerMessage: 'Invalid credentials.',
          userMessage: $localize`:@@invalidCredentials:Invalid credentials. Please try again.`,
          errorCode: ErrorCodes.InvalidCredentials,
        } : apiErrorFromHttpErrorResponse(err);
      },
    );
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
