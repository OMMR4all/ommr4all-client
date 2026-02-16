import {Component, Inject, OnInit} from '@angular/core';
import {ConfirmDialogModel} from '../confirm-dialog/confirm-dialog.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export class GenericInfoDialogModel {
  constructor(public title: string, public message: string) {
  }
}

@Component({
  selector: 'app-generic-info-dialog',
  templateUrl: './generic-info-dialog.component.html',
  styleUrls: ['./generic-info-dialog.component.scss']
})
export class GenericInfoDialogComponent implements OnInit {
  title: string;
  message: string;
  constructor(public dialogRef: MatDialogRef<GenericInfoDialogModel>,
              @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogModel) {
    // Update view with given values
    this.title = data.title;
    this.message = data.message;
  }

  ngOnInit() {
  }
  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close();
  }
}
