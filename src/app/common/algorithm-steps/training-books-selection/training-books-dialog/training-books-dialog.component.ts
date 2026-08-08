import { Component, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {AlgorithmTypes} from '../../../../book-view/book-step/algorithm-predictor-params';
import {TrainingBooksSelectionComponent} from '../training-books-selection.component';

export interface TrainingBooksDialogData {
  operation: AlgorithmTypes;
  currentBook: string;
  currentStyle: string;
  /** books selected so far, so reopening the dialog keeps the ticks */
  books: string[];
}

export interface TrainingBooksDialogResult {
  books: string[];
  bookCount: number;
  usablePages: number;
}

@Component({
    selector: 'app-training-books-dialog',
    templateUrl: './training-books-dialog.component.html',
    styleUrls: ['./training-books-dialog.component.scss'],
    standalone: false
})
export class TrainingBooksDialogComponent {
  private dialogRef = inject<MatDialogRef<TrainingBooksDialogComponent>>(MatDialogRef);
  data = inject<TrainingBooksDialogData>(MAT_DIALOG_DATA);

  @ViewChild(TrainingBooksSelectionComponent) selection: TrainingBooksSelectionComponent;

  books: string[] = [];

  cancel() {
    this.dialogRef.close();
  }

  apply() {
    this.dialogRef.close({
      books: this.books,
      // the trained book is part of both counts, it always contributes its data
      bookCount: this.selection ? this.selection.selectedBooks : 0,
      usablePages: this.selection ? this.selection.selectedPages : 0,
    } as TrainingBooksDialogResult);
  }
}
