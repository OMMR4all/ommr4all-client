import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';



@Component({
    selector: 'app-generic-progress-bar-dialog',
    templateUrl: './generic-progress-bar-dialog.component.html',
    styleUrls: ['./generic-progress-bar-dialog.component.css'],
    standalone: false
})
export class GenericProgressBarDialogComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<GenericProgressBarDialogComponent>>(MatDialogRef);


  ngOnInit() {
  }


  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
