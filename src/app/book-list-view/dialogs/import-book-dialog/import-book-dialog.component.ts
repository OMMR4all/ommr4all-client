import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {ApiError, ErrorCodes} from '../../../utils/api-error';
import {HttpClient, HttpErrorResponse, HttpEventType, HttpRequest} from '@angular/common/http';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AuthenticationService} from '../../../authentication/authentication.service';
import {FormControl, Validators} from "@angular/forms";

@Component({
  selector: 'app-import-book-dialog',
  templateUrl: './import-book-dialog.component.html',
  styleUrls: ['./import-book-dialog.component.scss']
})
export class ImportBookDialogComponent implements OnInit {
  apiError: ApiError | null = null;
  fileControl = new FormControl<File | null>(null, Validators.required);

  uploadProgress = 0;
  isUploading = false;

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService,
    private dialogRef: MatDialogRef<ImportBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {},
  ) {}

  ngOnInit() {}

  processUpload() {
    const file = this.fileControl.value;
    if (!file) { return; }

    this.isUploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', '/api/books/import', formData, {
      reportProgress: true
    });

    this.http.request(req).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.isUploading = false;
          this.close(true);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isUploading = false;
        this.apiError = err.error && typeof err.error === 'object'
          ? err.error
          : { userMessage: 'Upload failed' } as ApiError;
      }
    });
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
