import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface OverrideEditLockDialogComponentData {
  first_name: string;
  last_name: string;
  email: string;
}

@Component({
    selector: 'app-override-edit-lock-dialog',
    templateUrl: './override-edit-lock-dialog.component.html',
    styleUrls: ['./override-edit-lock-dialog.component.css'],
    standalone: false
})
export class OverrideEditLockDialogComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<OverrideEditLockDialogComponent>>(MatDialogRef);
  data = inject<OverrideEditLockDialogComponentData>(MAT_DIALOG_DATA);


  ngOnInit() {
  }

  get name() {
    if (this.data.first_name && this.data.last_name) {
      return this.data.first_name + ' ' + this.data.last_name;
    } else if (this.data.first_name) {
      return this.data.first_name;
    } else if (this.data.last_name) {
      return this.data.last_name;
    } else {
      return 'Unknown';
    }
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
