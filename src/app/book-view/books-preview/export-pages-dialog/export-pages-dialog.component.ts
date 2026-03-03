import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {BookCommunication, PageCommunication} from '../../../data-types/communication';
import { HttpClient } from '@angular/common/http';
import {BookMeta} from '../../../book-list.service';
import {downloadBlob} from '../../../utils/local-download';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../utils/api-error';

export interface BookData {
  pages: PageCommunication[];
  book: BookCommunication;
  bookMeta: BookMeta;
}

enum ExportStates {
  Idle,
  Downloading,
  Finished,
  Error,
}

@Component({
    selector: 'app-export-pages-dialog',
    templateUrl: './export-pages-dialog.component.html',
    styleUrls: ['./export-pages-dialog.component.css'],
    standalone: false
})
export class ExportPagesDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject<MatDialogRef<ExportPagesDialogComponent>>(MatDialogRef);
  data = inject<BookData>(MAT_DIALOG_DATA);

  readonly ES = ExportStates;
  selectDownloadContent = 'original_images.zip';
  apiError: ApiError;
  state = ExportStates.Idle;

  ngOnInit() {
  }

  close(result: boolean) { this.dialogRef.close(result); }

  onConfirm() {
    this.state = ExportStates.Downloading;
    this.http.post(this.data.book.downloadUrl(this.selectDownloadContent),
      {'pages': this.data.pages.map(p => p.page)},
      {responseType: 'blob'}).subscribe(
      res => {
        this.state = ExportStates.Finished;
        downloadBlob(res, this.data.bookMeta.name + '.' + this.selectDownloadContent);
        this.close(true);
      },
      error => {
        this.state = ExportStates.Error;
        this.apiError = apiErrorFromHttpErrorResponse(error);
      });
  }
}
