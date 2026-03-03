import { Component, OnInit, inject } from '@angular/core';
import {ConfirmDialogModel} from '../confirm-dialog/confirm-dialog.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export class GenericInfoDialogModel {
  constructor(public title: string, public message: string) {
  }
}

@Component({
    selector: 'app-generic-info-dialog',
    templateUrl: './generic-info-dialog.component.html',
    styleUrls: ['./generic-info-dialog.component.scss'],
    standalone: false
})
export class GenericInfoDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<GenericInfoDialogModel>>(MatDialogRef);
  data = inject<ConfirmDialogModel>(MAT_DIALOG_DATA);

  title: string;
  message: string;
  constructor() {
    const data = this.data;

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
