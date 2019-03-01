import {Component, Inject, OnInit} from '@angular/core';
import {BookMeta} from '../../../book-list.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BookCommunication} from '../../../data-types/communication';

export interface BookData {
  bookMeta: BookMeta;
  bookCom: BookCommunication;
}

@Component({
  selector: 'app-edit-book-info-dialog',
  templateUrl: './edit-book-info-dialog.component.html',
  styleUrls: ['./edit-book-info-dialog.component.css']
})
export class EditBookInfoDialogComponent implements OnInit {
  public errorMessage = '';

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<EditBookInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookData,
  ) {
    this.data = {bookMeta: BookMeta.copy(data.bookMeta), bookCom: data.bookCom};
  }

  ngOnInit() {
  }

  close(result: boolean|BookMeta) { this.dialogRef.close(result); }

  onConfirm() {
    this.http.put(this.data.bookCom.meta(), this.data.bookMeta).subscribe(
      () => { this.close(this.data.bookMeta); },
      (err: HttpErrorResponse) => { this.errorMessage = err.message; }
    );
  }

}
