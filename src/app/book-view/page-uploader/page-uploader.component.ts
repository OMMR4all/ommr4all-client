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
import { HostListener } from '@angular/core';
@Component({
    selector: 'app-page-uploader',
    templateUrl: './page-uploader.component.html',
    styleUrls: ['./page-uploader.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PageUploaderComponent implements OnInit {
  tempFiles: any = null;
  apiError: ApiError | null = null;
  uploadingFiles = new Set<File>(); // Track active uploads
  public isDraggingGlobal = false;
  private dragCounter = 0;
  @Input() book: BookCommunication;
  @Output() uploadSuccess = new EventEmitter();

  constructor(
    private auth: AuthenticationService,
    private http: HttpClient,
    private changeDetector: ChangeDetectorRef // 👈 Needed for OnPush
  ) {
  }

  ngOnInit() {
  }


  onSelect(event: any) {
    console.log('Dropzone Event Data:', event);

    // Since your log shows the event IS the array: (4) [File, File, File, File]
    let files: File[] = [];

    if (Array.isArray(event)) {
      files = event;
    } else if (event?.files) {
      files = event.files;
    }

    if (files.length > 0) {
      console.log('Starting upload for', files.length, 'files');
      files.forEach(file => this.uploadFile(file));
    } else {
      console.warn('No files found in the event array');
    }
  }

  private uploadFile(file: File) {
    if (!this.book) {
      return;
    }

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

  @HostListener('window:dragenter', ['$event'])
  onWindowDragEnter(event: DragEvent) {
    event.preventDefault();
    this.dragCounter++;
    if (this.dragCounter === 1) {
      this.isDraggingGlobal = true;
      this.changeDetector.markForCheck();
    }
  }

  @HostListener('window:dragleave', ['$event'])
  onWindowDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.isDraggingGlobal = false;
      this.changeDetector.markForCheck();
    }
  }

  @HostListener('window:dragover', ['$event'])
  onWindowDragOver(event: DragEvent) {
    event.preventDefault(); // Required to allow a drop
  }

  @HostListener('window:drop', ['$event'])
  onWindowDrop(event: DragEvent) {
    event.preventDefault();
    this.isDraggingGlobal = false;
    this.dragCounter = 0;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onSelect(Array.from(files)); // reuse your existing upload logic
    }
    this.changeDetector.markForCheck();
  }
}
