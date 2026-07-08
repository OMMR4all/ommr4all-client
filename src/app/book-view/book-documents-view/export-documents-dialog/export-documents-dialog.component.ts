import { Component, OnDestroy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import {BookCommunication} from '../../../data-types/communication';
import {TaskWorker} from '../../../editor/task';
import {AlgorithmTypes} from '../../book-step/algorithm-predictor-params';
import {downloadBase64} from '../../../utils/local-download';
import {ApiError} from '../../../utils/api-error';

export interface ExportDocumentsData {
  book: BookCommunication;
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

  selectedFormat = 'monodiplus.zip';
  task: TaskWorker = null;
  apiError: ApiError;

  get running() { return this.task && !this.task.taskStatusFinished && !this.task.taskStatusError && !this.task.taskStatusUnavailable; }

  onConfirm() {
    if (this.running) { return; }
    this.apiError = null;
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

  close() {
    if (this.running) {
      this.task.cancelTask().catch(() => {});
    }
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    if (this.task) { this.task.stopStatusPoller(); }
  }
}
