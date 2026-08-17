import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import {BookCommunication} from '../../data-types/communication';
import {AuthenticationService} from '../../authentication/authentication.service';
import {ApiError, ErrorCodes} from '../../utils/api-error';
import { HttpClient, HttpErrorResponse, HttpEventType, HttpRequest } from '@angular/common/http';
import { HostListener } from '@angular/core';
import {from, Observable} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {formatDuration} from '../../utils/duration';

/** One file of the current upload queue, with its own byte progress. */
interface UploadItem {
  file: File;
  loaded: number;
  total: number;
  state: 'pending' | 'uploading' | 'done' | 'failed';
  pagesCreated: number;
}

/**
 * The server reports which pages it created, so a PDF (one file, many pages) is
 * counted honestly instead of as a single page.
 */
interface UploadResponse {
  pages?: string[];
}

// Browsers only run ~6 requests per host anyway, and a whole book dropped at once
// would otherwise open hundreds of sockets and hold every file in memory.
const MAX_PARALLEL_UPLOADS = 3;

@Component({
    selector: 'app-page-uploader',
    templateUrl: './page-uploader.component.html',
    styleUrls: ['./page-uploader.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PageUploaderComponent implements OnInit, OnDestroy {
  private auth = inject(AuthenticationService);
  private http = inject(HttpClient);
  private changeDetector = inject(ChangeDetectorRef);

  tempFiles: any = null;
  apiError: ApiError | null = null;
  public isDraggingGlobal = false;
  private dragCounter = 0;
  @Input() book: BookCommunication;
  @Output() uploadSuccess = new EventEmitter();

  // The queue of the current upload run. Files dropped while an upload is in
  // flight are appended, so the counters never jump backwards.
  uploads: UploadItem[] = [];
  failedFiles: string[] = [];
  private startedAtMs = 0;
  private finishedAtMs = 0;
  // OnPush only re-renders on upload events, which stop arriving while the server
  // rasterizes a PDF — this keeps the elapsed time ticking meanwhile.
  private timerHandle;

  ngOnInit() {
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startTimer() {
    if (!this.timerHandle) {
      this.timerHandle = setInterval(() => this.changeDetector.markForCheck(), 1000);
    }
  }

  private stopTimer() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = undefined;
    }
  }

  get uploading(): boolean { return this.uploads.some(u => u.state === 'pending' || u.state === 'uploading'); }
  get totalFiles(): number { return this.uploads.length; }
  get completedFiles(): number { return this.uploads.filter(u => u.state === 'done' || u.state === 'failed').length; }
  get currentFile(): number { return Math.min(this.completedFiles + 1, this.totalFiles); }
  get pagesCreated(): number { return this.uploads.reduce((sum, u) => sum + u.pagesCreated, 0); }
  get failedFileNames(): string { return this.failedFiles.join(', '); }

  /** Byte-smoothed but monotone: finished files count in full, in-flight ones by fraction. */
  get progress(): number {
    if (this.totalFiles === 0) { return 0; }
    const done = this.uploads.reduce((sum, u) => {
      if (u.state === 'done' || u.state === 'failed') { return sum + 1; }
      if (u.total > 0) { return sum + Math.min(u.loaded / u.total, 1); }
      return sum;
    }, 0);
    return (done / this.totalFiles) * 100;
  }

  /** Live while uploading, frozen at the total once the queue drained. */
  get elapsedLabel(): string {
    if (this.startedAtMs === 0) { return ''; }
    return formatDuration(((this.finishedAtMs || Date.now()) - this.startedAtMs) / 1000);
  }

  onSelect(event: any) {
    let files: File[] = [];

    if (Array.isArray(event)) {
      files = event;
    } else if (event?.files) {
      files = event.files;
    }

    if (files.length > 0) {
      this.enqueue(files);
    }
  }

  private enqueue(files: File[]) {
    if (!this.book) { return; }

    if (!this.uploading) {
      // start a fresh run: drop the counters of the previous one
      this.uploads = [];
      this.failedFiles = [];
      this.startedAtMs = Date.now();
      this.finishedAtMs = 0;
    }

    const items: UploadItem[] = files.map(file => ({
      file, loaded: 0, total: file.size, state: 'pending', pagesCreated: 0,
    }));
    this.uploads = this.uploads.concat(items);
    this.startTimer();
    this.changeDetector.markForCheck();

    from(items).pipe(
      mergeMap(item => this.upload(item), MAX_PARALLEL_UPLOADS),
    ).subscribe({
      next: () => {
        if (!this.uploading) {
          this.finishedAtMs = Date.now();
          this.stopTimer();
          this.uploadSuccess.emit();
        }
        this.changeDetector.markForCheck();
      },
      complete: () => this.changeDetector.markForCheck(),
    });
  }

  /**
   * Uploads a single file. Errors are recorded on the item and never propagated,
   * so one bad file cannot abort the rest of the queue.
   */
  private upload(item: UploadItem): Observable<UploadItem> {
    const formData = new FormData();
    formData.append('file', item.file);
    const req = new HttpRequest('POST', `/api/book/${this.book.book}/upload/`, formData, {
      reportProgress: true,
    });

    return new Observable<UploadItem>(observer => {
      item.state = 'uploading';
      const sub = this.http.request<UploadResponse>(req).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            item.loaded = event.loaded;
            item.total = event.total;
            this.changeDetector.markForCheck();
          } else if (event.type === HttpEventType.Response) {
            item.loaded = item.total;
            item.state = 'done';
            const pages = event.body && event.body.pages;
            // an older server answers with an empty body: one file counts as one page
            item.pagesCreated = pages ? pages.length : 1;
          }
        },
        error: (err: HttpErrorResponse) => {
          item.state = 'failed';
          this.failedFiles.push(item.file.name);
          this.handleError(err);
          observer.next(item);
          observer.complete();
        },
        complete: () => {
          observer.next(item);
          observer.complete();
        },
      });
      return () => sub.unsubscribe();
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
