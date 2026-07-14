import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ToolBarButtonDef} from '../../tool-bar/tool-bar-buttons';

export interface ToolbarCustomizeDialogData {
  sectionTitle: string;
  buttons: ToolBarButtonDef[];
  hidden: string[];
}

@Component({
    selector: 'app-toolbar-customize-dialog',
    templateUrl: './toolbar-customize-dialog.component.html',
    styleUrls: ['./toolbar-customize-dialog.component.css'],
    standalone: false
})
export class ToolbarCustomizeDialogComponent {
  private dialogRef = inject<MatDialogRef<ToolbarCustomizeDialogComponent>>(MatDialogRef);
  data = inject<ToolbarCustomizeDialogData>(MAT_DIALOG_DATA);

  private readonly shown = new Set<string>(
    this.data.buttons.filter(b => b.forced || this.data.hidden.indexOf(b.id) < 0).map(b => b.id)
  );

  isShown(b: ToolBarButtonDef): boolean {
    return this.shown.has(b.id);
  }

  toggle(b: ToolBarButtonDef, checked: boolean) {
    if (b.forced) { return; }
    if (checked) {
      this.shown.add(b.id);
    } else {
      this.shown.delete(b.id);
    }
  }

  cancel() {
    this.dialogRef.close(undefined);
  }

  confirm() {
    // result: ids of this section's buttons to hide in the overflow menu
    this.dialogRef.close(this.data.buttons.filter(b => !b.forced && !this.shown.has(b.id)).map(b => b.id));
  }
}
