import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {ApiError} from '../../../utils/api-error';
import {HttpClient} from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {BookMeta} from '../../../book-list.service';
import {BookCommunication} from '../../../data-types/communication';
import {ServerUrls} from '../../../server-urls';

interface BookData {
  book: BookMeta;
  bookCom: BookCommunication;
}

interface Result {
  current: number;
  total: number;
  counts: {
    nPages: number,
    nStaves: number,
    nStaffLines: number,
    nSymbols: number,
    nNoteComponents: number,
    nClefs: number,
    nAccids: number,
  };
}

@Component({
  selector: 'app-book-stats-dialog',
  templateUrl: './book-stats-dialog.component.html',
  styleUrls: ['./book-stats-dialog.component.scss']
})
export class BookStatsDialogComponent implements OnInit {
  public apiError: ApiError;
  public taskId: string = undefined;
  public result: Result;
  displayedColumns: string[] = ['name', 'value'];
  public tableData: any;


  private updateTableData() {
    this.tableData = Object.keys(this.result.counts).map(k => {
      return {name: k, value: this.result.counts[k]};
    });
  }

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<BookStatsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookData,
  ) {
  }

  ngOnInit() {
    // launch task
    this.http.get(this.data.bookCom.url('stats')).subscribe((r: Result) => {
      this.result = r;
      this.updateTableData();
    });
  }

  close() {
    this.dialogRef.close();
  }


}
