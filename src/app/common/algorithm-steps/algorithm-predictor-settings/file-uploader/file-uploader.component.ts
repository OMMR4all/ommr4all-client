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
import {BookCommunication} from '../../../../data-types/communication';
import {AuthenticationService} from '../../../../authentication/authentication.service';
import {DropzoneComponent, DropzoneConfig, DropzoneConfigInterface} from 'ngx-dropzone-wrapper';
import {ApiError, ErrorCodes} from '../../../../utils/api-error';

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class FileUploaderComponent implements OnInit {
  apiError: ApiError;
  @ViewChild(DropzoneComponent, {static: false}) componentRef?: DropzoneComponent;
  @Output() uploadSuccess = new EventEmitter();
  private fileArray: File[] = [];
  readonly config: DropzoneConfigInterface = {
    url: 'localhost',
    maxFilesize: 5,
    autoQueue: false,
    headers: {
      Authorization: 'JWT ' + this.auth.token,
    },
    autoProcessQueue: true,
  };

  constructor(
    private auth: AuthenticationService,
  ) {
  }
  ngOnInit() {
  }
  onSingleUploadError(event: [File, string, XMLHttpRequest]) {
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
  onAddedFile(data): void {
    const file: File = data;
    this.fileArray.push(file);

    function fileToText(fileobj, callback) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        callback(reader.result);
      };
    }
    if (file.type === 'text/plain') {
      console.log(file.name);
      console.log(file.type);
      console.log(file.size);
      console.log(this.fileArray);
      fileToText(file, (text) => {
        this.fileArray.push(text);
        });
      }
    }
  }

