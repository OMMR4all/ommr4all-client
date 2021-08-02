import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BookCommunication} from '../../data-types/communication';
import {AvailableModels, ModelMeta} from '../../data-types/models';
import {MatDialog, MatTable} from '@angular/material';
import {ConfirmDialogComponent, ConfirmDialogModel} from '../../common/confirm-dialog/confirm-dialog.component';
import {forkJoin} from 'rxjs';
import {AlgorithmTypes} from '../book-step/algorithm-predictor-params';

interface DataRow {
  modelMeta: ModelMeta;
  operation: AlgorithmTypes;
}

@Component({
  selector: 'app-book-train-overview',
  templateUrl: './book-train-overview.component.html',
  styleUrls: ['./book-train-overview.component.scss']
})
export class BookTrainOverviewComponent implements OnInit {
  @Input() book: BookCommunication;
  @ViewChild(MatTable) modelTable;

  loading = false;
  displayedColumns: string[] = ['id', 'date', 'accuracy', 'delete'];
  data = new Array<DataRow>();

  private readonly operations = [AlgorithmTypes.StaffLinesPC, AlgorithmTypes.SymbolsPC, AlgorithmTypes.TextCalamari];
  private readonly dataOperations = new Map<AlgorithmTypes, AvailableModels>();

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.refresh();
  }

  private refresh() {
    this.loading = true;
    this.data.length = 0;
    this.dataOperations.clear();
    this.operations.forEach(op => {
      this.refreshForOperation(op);
    });
  }


  private refreshForOperation(op: AlgorithmTypes) {
    this.http.get<AvailableModels>(this.book.operationUrl(op, '/models')).subscribe(
      r => {
        r.book_models.forEach(bm => this.data.push({
          modelMeta: bm,
          operation: op,
        }));
        this.dataOperations.set(op, r);
        this.modelTable.renderRows();
        this.loading = false;
      }
    );
  }

  deleteModel(row: DataRow) {
    const message = 'Are you sure you want to delete this model?';
    const dialogData = new ConfirmDialogModel('Confirm', message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.http.delete(this.book.operationUrl(row.operation, 'model/' + encodeURIComponent(row.modelMeta.id))).subscribe(
          () => {
            this.data.splice(this.data.indexOf(row), 1);
            this.modelTable.renderRows();
          }
        );
      }
    });
  }

  cleanOutdatedModels() {
    const toDelete = new Array<{op: AlgorithmTypes, id: string}>();
    this.operations.filter(op => this.dataOperations.has(op)).forEach(op => {
      const ops = this.dataOperations.get(op);
      ops.book_models.slice(1).filter(m => m.id !== ops.selected_model.id).forEach(
        m => toDelete.push({op, id: m.id})
      );
    });
    const message = 'Are you sure you want to clean ' + toDelete.length + ' models?';
    const dialogData = new ConfirmDialogModel('Confirm', message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        forkJoin(toDelete.map(m => this.http.delete(this.book.operationUrl(m.op, 'model/' + encodeURIComponent(m.id)))
        )).subscribe(
          r => {
            this.refresh();
          }
        );
      }
    });
  }
}
