import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {BookCommunication, PageCommunication} from '../../../data-types/communication';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import {BookMeta} from '../../../book-list.service';
import {openDownloadUrl} from '../../../utils/local-download';
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
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject<MatDialogRef<ExportPagesDialogComponent>>(MatDialogRef);
  data = inject<BookData>(MAT_DIALOG_DATA);

  readonly ES = ExportStates;
  selectDownloadContent = 'original_images.zip';
  /** Backup only: keep the images that can be recomputed, giving an exact copy of the book folder. */
  includeRecomputable = false;
  apiError: ApiError;
  state = ExportStates.Idle;

  ngOnInit() {
  }

  close(result: boolean) { this.dialogRef.close(result); }

  /**
   * Ask the server for a signed, short lived URL and let the browser download it.
   *
   * The archive is streamed from disk with a real Content-Length, so the browser can
   * show progress and an ETA and writes straight to disk — a large backup never has
   * to fit into the tab's (or the server's) memory.
   */
  onConfirm() {
    this.state = ExportStates.Downloading;
    this.http.post<{url: string, filename: string}>(
      this.data.book.downloadTokenUrl(this.selectDownloadContent),
      {'pages': this.data.pages.map(p => p.page), 'full': this.includeRecomputable}).subscribe({
      next: res => {
        this.state = ExportStates.Finished;
        openDownloadUrl(res.url);
        this.snackBar.open(
          $localize`Download of ${res.filename} started. See your browser's downloads for its progress.`,
          $localize`:@@snackBarDismiss:Close`, {duration: 8000});
        this.close(true);
      },
      error: error => {
        this.state = ExportStates.Error;
        this.apiError = apiErrorFromHttpErrorResponse(error);
      }});
  }
}
