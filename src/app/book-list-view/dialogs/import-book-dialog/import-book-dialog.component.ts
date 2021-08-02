import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {ApiError, ErrorCodes} from '../../../utils/api-error';
import {HttpClient} from '@angular/common/http';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DropzoneComponent, DropzoneConfigInterface} from 'ngx-dropzone-wrapper';
import {AuthenticationService} from '../../../authentication/authentication.service';

@Component({
  selector: 'app-import-book-dialog',
  templateUrl: './import-book-dialog.component.html',
  styleUrls: ['./import-book-dialog.component.scss']
})
export class ImportBookDialogComponent implements OnInit {
  apiError: ApiError;
  @ViewChild(DropzoneComponent) componentRef?: DropzoneComponent;

  config: DropzoneConfigInterface = {
    url: '/api/books/import',
    maxFilesize: 50000,
    acceptedFiles: 'application/zip',
    headers: {
      'Authorization': 'JWT ' + this.auth.token,
    },
    autoProcessQueue: false,
  };

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService,
    private dialogRef: MatDialogRef<ImportBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {},
  ) {
  }

  ngOnInit() {
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }

  onSingleUploadError(event: [File, string, XMLHttpRequest]) {
    const httpRq: XMLHttpRequest = event[2];
    if (httpRq.response) {
      this.apiError = JSON.parse(httpRq.response);
    } else if (httpRq.status === 413) {
      this.apiError = {
        status: httpRq.status,
        developerMessage: httpRq.responseText,
        userMessage: 'File too large',
        errorCode: ErrorCodes.BookPageUploadFailedPayloadTooLarge,
      };
    } else {
      this.apiError = {
        status: httpRq.status,
        developerMessage: 'Unknown server error when uploading a new page.',
        userMessage: 'Unknown server error. Retry or try to contact an administrator.',
        errorCode: ErrorCodes.UnknownError,
      };
    }
  }

  onSingleUploadSuccess(event) {
  }

  onSingleCanceled(event) {
  }

  onSingleComplete(event) {
  }

  onQueueComplete(event) {
  }

  onReset(event) {
  }

  onMaxFilesReached(event) {
  }

  onMaxFilesExceeded(event) {
  }
}
