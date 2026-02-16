import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';



@Component({
  selector: 'app-generic-progress-bar-dialog',
  templateUrl: './generic-progress-bar-dialog.component.html',
  styleUrls: ['./generic-progress-bar-dialog.component.css']
})
export class GenericProgressBarDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<GenericProgressBarDialogComponent>,
  ) { }

  ngOnInit() {
  }


  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
