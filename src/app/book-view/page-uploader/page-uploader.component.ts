import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {BookCommunication} from '../../data-types/communication';
import {AuthenticationService} from '../../authentication/authentication.service';
import {ApiError, ErrorCodes} from '../../utils/api-error';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
@Component({
  selector: 'app-page-uploader',
  templateUrl: './page-uploader.component.html',
  styleUrls: ['./page-uploader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageUploaderComponent implements OnInit {
  apiError: ApiError | null = null;
  uploadingFiles = new Set<File>(); // Track active uploads

  @Input() book: BookCommunication;
  @Output() uploadSuccess = new EventEmitter();

  constructor(
    private auth: AuthenticationService,
    private http: HttpClient,
    private changeDetector: ChangeDetectorRef // 👈 Needed for OnPush
  ) {}

  ngOnInit() {}

  // Triggered when files are dropped
  onSelect(event: any) {
    const files: File[] = event.addedFiles;
    files.forEach(file => this.uploadFile(file));
  }

  private uploadFile(file: File) {
    if (!this.book) { return; }

    this.uploadingFiles.add(file);
    const formData = new FormData();
    formData.append('file', file);

    const url = `/api/book/${this.book.book}/upload/`;

    this.http.post(url, formData).subscribe({
      next: () => {
        this.uploadingFiles.delete(file);
        if (this.uploadingFiles.size === 0) {
          this.uploadSuccess.emit();
        }
        this.changeDetector.markForCheck(); // Update UI
      },
      error: (err: HttpErrorResponse) => {
        this.uploadingFiles.delete(file);
        this.handleError(err);
        this.changeDetector.markForCheck();
      }
    });
  }

  private handleError(err: HttpErrorResponse) {
    if (err.status === 413) {
      this.apiError = {
        status: err.status,
        userMessage: 'File too large',
        errorCode: ErrorCodes.BookPageUploadFailedPayloadTooLarge,
      } as ApiError;
    } else {
      this.apiError = {
        status: err.status,
        userMessage: 'Unknown server error. Retry or try to contact an administrator.',
        errorCode: ErrorCodes.UnknownError,
      } as ApiError;
    }
  }
}
