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
  private fileArray: string[] = [];
  readonly config: DropzoneConfigInterface = {
    url: 'localhost',
    maxFilesize: 5,
    autoQueue: false,
    headers: {
      Authorization: 'JWT ' + this.auth.token,
    },
    autoProcessQueue: true,
  };
  @Output() selectedPCGTSContentToEmit = new EventEmitter<string[]>();
  changeSelectedPCGTSContent(s: string[]) {
    this.selectedPCGTSContentToEmit.emit(s);
  }
  constructor(
    private auth: AuthenticationService,
  ) {
  }
  ngOnInit() {
  }

  onQueueComplete(event) {
    this.componentRef.directiveRef.reset(false);
  }

  onAddedFile(data): void {
    const file: File = data;

    function fileToText(fileobj, callback) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        callback(reader.result);
      };
    }
    if (file.type === 'text/plain') {
      fileToText(file, (text) => {
        this.fileArray.push(text);
        });
      }
    this.changeSelectedPCGTSContent(this.fileArray);
    }
  }

