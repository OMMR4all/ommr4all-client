import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
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
