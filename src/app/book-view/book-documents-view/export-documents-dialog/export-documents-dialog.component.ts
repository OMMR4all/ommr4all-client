import { Component, OnDestroy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import {BookCommunication, DocumentCommunication} from '../../../data-types/communication';
import {TaskWorker} from '../../../editor/task';
import {AlgorithmTypes} from '../../book-step/algorithm-predictor-params';
import {downloadBase64, downloadBlob} from '../../../utils/local-download';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../utils/api-error';
import {Document} from '../../../book-documents';

export interface ExportDocumentsData {
  book: BookCommunication;
  // set to export a single document (chant) instead of all documents of the book
  document?: Document;
}

@Component({
    selector: 'app-export-documents-dialog',
    templateUrl: './export-documents-dialog.component.html',
    styleUrls: ['./export-documents-dialog.component.css'],
    standalone: false
})
export class ExportDocumentsDialogComponent implements OnDestroy {
  private http = inject(HttpClient);
  private dialogRef = inject<MatDialogRef<ExportDocumentsDialogComponent>>(MatDialogRef);
  data = inject<ExportDocumentsData>(MAT_DIALOG_DATA);

  // a single document is exported as one json / one zip, the whole book always as a zip
  selectedFormat = this.singleDocument ? 'monodiplus.json' : 'monodiplus.zip';
  task: TaskWorker = null;
  downloading = false;
  apiError: ApiError;

  get singleDocument(): Document { return this.data.document; }

  get running() {
    if (this.downloading) { return true; }
    return this.task && !this.task.taskStatusFinished && !this.task.taskStatusError && !this.task.taskStatusUnavailable;
  }

  onConfirm() {
    if (this.running) { return; }
    this.apiError = null;
    if (this.singleDocument) {
      this.downloadDocument();
      return;
    }
    this.task = new TaskWorker(AlgorithmTypes.DocumentsExport, this.http, this.data.book, {format: this.selectedFormat});
    this.task.taskFinished.subscribe((res: {filename: string, mime: string, data: string}) => {
      if (res && res.data) {
        downloadBase64(res.data, res.mime, res.filename || this.data.book.book + '.' + this.selectedFormat);
        this.dialogRef.close(true);
      } else {
        this.apiError = this.task.apiError;
        this.task = null;
      }
    });
    this.task.putTask();
  }

  private downloadDocument() {
    // one chant is a handful of pages, so the server exports it synchronously
    const com = new DocumentCommunication(this.data.book, this.singleDocument.doc_id);
    const name = this.initium || this.singleDocument.doc_id;
    this.downloading = true;
    this.http.get(com.document_download_url(this.selectedFormat), {responseType: 'blob'}).subscribe(
      blob => {
        this.downloading = false;
        downloadBlob(blob, name + '.' + this.selectedFormat);
        this.dialogRef.close(true);
      },
      error => {
        this.downloading = false;
        this.apiError = apiErrorFromHttpErrorResponse(error);
      });
  }

  private get initium(): string {
    const doc = this.singleDocument;
    const initium = doc.document_meta_infos.initium || doc.textinitium || '';
    return initium.replace(/-/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').substring(0, 60);
  }

  close() {
    if (this.task && this.running) {
      this.task.cancelTask().catch(() => {});
    }
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    if (this.task) { this.task.stopStatusPoller(); }
  }
}
