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
import {DropzoneComponent} from 'ngx-dropzone-wrapper';
import {ApiError, ErrorCodes} from '../../utils/api-error';

@Component({
  selector: 'app-page-uploader',
  templateUrl: './page-uploader.component.html',
  styleUrls: ['./page-uploader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageUploaderComponent implements OnInit {
  apiError: ApiError;
  @ViewChild(DropzoneComponent) componentRef?: DropzoneComponent;

  private _book: BookCommunication;
  @Input() set book(book: BookCommunication) {
    if (this._book !== book) {
      this._book = book;
      this.updateConfig();
    }
  }
  get book() { return this._book; }
  @Output() uploadSuccess = new EventEmitter();

  constructor(
    private auth: AuthenticationService,
  ) {
    this.auth.userObs.subscribe(value => {
      this.updateConfig();
    });
  }

  private _config = {};
  get config() { return this._config; }

  ngOnInit() {
  }

  onSingleUploadError(event: [File, string, XMLHttpRequest]) {
    const httpRq: XMLHttpRequest = event[2];
    if (httpRq.status === 413) {
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
    this.componentRef.directiveRef.reset(false);
  }

  onReset(event) {
    this.uploadSuccess.emit();
  }

  onMaxFilesReached(event) {
  }

  onMaxFilesExceeded(event) {
  }

  private updateConfig() {
    if (!this.book || !this.auth.token) { return {}; }
    this._config = {
      url: '/api/book/' + this.book.book + '/upload/',
      maxFilesize: 500,
      acceptedFiles: 'image/*,application/pdf',
      headers: {
        Authorization: 'JWT ' + this.auth.token,
      },
      autoProcessQueue: true,
    };
  }

}
