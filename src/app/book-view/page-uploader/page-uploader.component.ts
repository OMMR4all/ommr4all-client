import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BookCommunication} from '../../data-types/communication';
import {AuthenticationService} from '../../authentication/authentication.service';

@Component({
  selector: 'app-page-uploader',
  templateUrl: './page-uploader.component.html',
  styleUrls: ['./page-uploader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageUploaderComponent implements OnInit {
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
    this.auth.tokenObs.subscribe(value => {
      this.updateConfig();
    });
  }

  private _config = {};
  get config() { return this._config; }

  ngOnInit() {
  }

  onUploadError(event) {
    console.log(event);
  }

  onUploadSuccess(event) {
    console.log(event);
    this.uploadSuccess.emit();
  }

  private updateConfig() {
    if (!this.book || !this.auth.token) { return {}; }
    this._config = {
      url: '/api/book/' + this.book.book + '/upload/', maxFilesize: 50,
      acceptedFiles: 'image/*',
      headers: {
        'Authorization': 'JWT ' + this.auth.token,
      },
      autoProcessQueue: true,
      autoReset: 500,
    };
  }

}
