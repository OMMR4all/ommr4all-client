import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {ApiError} from '../../../utils/api-error';
import {ConfirmDialogComponent} from '../../../common/confirm-dialog/confirm-dialog.component';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
export class StatusInfo {
  public title: string;
  public message: string;
  constructor(title: string, message: string) {
    this.title = title;
    this.message = message;
  }
}

@Component({
  selector: 'app-monodi-status-dialog',
  templateUrl: './monodi-status-dialog.component.html',
  styleUrls: ['./monodi-status-dialog.component.scss']
})
export class MonodiStatusDialogComponent implements OnInit {
  apiError: ApiError;
  public title = '';
  public message = '';

  constructor(public dialogRef: MatDialogRef<MonodiStatusDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: StatusInfo) {
    // Update view with given values
    this.title = data.title;
    this.message = data.message;
  }


  onView(): void {
    // Close the dialog, return true
    this.dialogRef.close('view');
  }

  onEdit(): void {
    // Close the dialog, return false
    this.dialogRef.close('edit');
  }

  ngOnInit(): void {
  }
  onCancel() {
    this.dialogRef.close('cancel');
  }

}
