import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ApiError} from '../../../utils/api-error';
import {ServerUrls} from '../../../server-urls';

/** One book that contributed ground truth, as stored in the model's training.json. */
export interface TrainingBook {
  book: string;
  book_name: string;
  train_pages: string[];
  validation_pages: string[];
}

export interface TrainingInfo {
  algorithm_type: string;
  target_book: string;
  started: string;
  finished: string;
  started_by: string;
  pretrained_model: string;
  n_train: number;
  n_epoch: number;
  params: Record<string, unknown>;
  dataset_params: Record<string, unknown>;
  books: TrainingBook[];
  n_train_pages: number;
  n_validation_pages: number;
}

export interface ModelTrainingDialogData {
  id: string;
  label: string;
  owner: string;
}

@Component({
    selector: 'app-model-training-dialog',
    templateUrl: './model-training-dialog.component.html',
    styleUrls: ['./model-training-dialog.component.scss'],
    standalone: false
})
export class ModelTrainingDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject<MatDialogRef<ModelTrainingDialogComponent>>(MatDialogRef);
  data = inject<ModelTrainingDialogData>(MAT_DIALOG_DATA);

  loading = true;
  apiError: ApiError = null;
  training: TrainingInfo = null;
  // the trainer parameters worth showing; the raw dicts are kept in the model directory
  paramRows: {name: string, value: string}[] = [];

  ngOnInit() {
    this.http.get<{training: TrainingInfo}>(ServerUrls.administrative('models/training'),
      {params: new HttpParams().set('id', this.data.id)}).subscribe(
      r => {
        this.loading = false;
        this.training = r.training;
        this.paramRows = this.toParamRows(r.training);
      },
      error => { this.loading = false; this.apiError = error.error as ApiError; },
    );
  }

  private toParamRows(t: TrainingInfo): {name: string, value: string}[] {
    if (!t) { return []; }
    const rows = [];
    const add = (name: string, value: unknown) => {
      if (value !== null && value !== undefined && value !== '' && value !== -1) {
        rows.push({name, value: String(value)});
      }
    };
    add($localize`Epochs`, t.n_epoch);
    add($localize`Training share`, t.n_train);
    add($localize`Pretrained model`, t.pretrained_model);
    add($localize`Started by`, t.started_by);
    const p = t.params || {};
    add($localize`Learning rate`, p['l_rate']);
    add($localize`Early stopping (max keep)`, p['early_stopping_max_keep']);
    add($localize`Data augmentation factor`, p['data_augmentation_factor']);
    add($localize`Training data multiplier`, p['train_data_multiplier']);
    return rows;
  }

  close() { this.dialogRef.close(); }
}
