import {Component, Inject, OnInit} from '@angular/core';
import {MatLegacyDialog as MatDialog} from '@angular/material/legacy-dialog';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
export class ConfirmDialogModel {
  constructor(public title: string, public message: string) {
  }
}
@Component({
  selector: 'app-workflow-finish-dialog',
  templateUrl: './workflow-finish-dialog.component.html',
  styleUrls: ['./workflow-finish-dialog.component.scss']
})
export class WorkflowFinishDialogComponent implements OnInit {

  title: string;
  message: string;

  constructor(public dialogRef: MatDialogRef<WorkflowFinishDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogModel) {
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
