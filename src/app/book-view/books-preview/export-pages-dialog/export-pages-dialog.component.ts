import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BookCommunication, PageCommunication} from '../../../data-types/communication';
import {HttpClient} from '@angular/common/http';

export interface BookData {
  pages: Array<PageCommunication>;
  book: BookCommunication;
}

@Component({
  selector: 'app-export-pages-dialog',
  templateUrl: './export-pages-dialog.component.html',
  styleUrls: ['./export-pages-dialog.component.css']
})
export class ExportPagesDialogComponent implements OnInit {
  selectDownloadContent = 'annotations.zip';
  public errorMessage = '';

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<ExportPagesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookData,
  ) {
  }

  ngOnInit() {
  }

  close(result: boolean) { this.dialogRef.close(result); }

  onConfirm() {
    this.http.post(this.data.book.downloadUrl(this.selectDownloadContent),
      {'pages': this.data.pages.map(p => p.page)},
      {responseType: 'blob'}).subscribe(
      res => window.open(URL.createObjectURL(res), '_blank'),
      error => {
        const resp = error as Response;
        this.errorMessage = 'Unknown server error (' + resp.status + ').';
      });
  }
}
