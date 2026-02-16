import {Component, Inject, OnInit} from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';



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
