import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ServerUrls} from '../../../server-urls';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../utils/api-error';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {GlobalSettingsService} from '../../../global-settings.service';
import {BookMeta} from '../../../book-list.service';

@Component({
  selector: 'app-add-new-dialog',
  templateUrl: './add-new-dialog.component.html',
  styleUrls: ['./add-new-dialog.component.css']
})
export class AddNewDialogComponent implements OnInit, OnDestroy {
  apiError: ApiError;
  form = new FormGroup({
    name: new FormControl(undefined, [
      Validators.required,
      Validators.minLength(4),
    ]),
    notationStyle: new FormControl('french14', [
      Validators.required,
    ]),
    numberOfStaffLines: new FormControl(4, [
      Validators.required,
      Validators.max(10),
      Validators.min(0),
    ]),
  });

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<AddNewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {},
    public globalSettings: GlobalSettingsService,
    ) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }

  add() {
    if (!this.form.valid) { return; }
    const data = new BookMeta();
    data.name = this.form.get('name').value;
    data.numberOfStaffLines = this.form.get('numberOfStaffLines').value;
    data.notationStyle =this.form.get('notationStyle').value;
    this.http.put(ServerUrls.addBook(), data.toJson()).subscribe(
      book => {
        this.close(true);
      },
      error => {
        this.apiError = apiErrorFromHttpErrorResponse(error);
      }
    );
  }
}
