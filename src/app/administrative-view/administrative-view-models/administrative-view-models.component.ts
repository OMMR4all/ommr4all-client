import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {ConfirmDialogComponent, ConfirmDialogModel} from '../../common/confirm-dialog/confirm-dialog.component';
import {ApiError} from '../../utils/api-error';
import {ServerUrls} from '../../server-urls';
import {AlgorithmTypes, metaForAlgorithmType} from '../../book-view/book-step/algorithm-predictor-params';
import {
  ModelTrainingDialogComponent,
  ModelTrainingDialogData,
} from './model-training-dialog/model-training-dialog.component';

/** What a model was trained on; null for models trained before the record existed. */
export interface AdminModelTraining {
  books: number;
  trainPages: number;
  validationPages: number;
  nEpoch: number;
  pretrained: string;
  startedBy: string;
  finished: string;
}

/** One trained model on the server, as reported by GET /administrative/models. */
export interface AdminModel {
  id: string;
  storage: string;
  book: string;
  bookName?: string;
  style: string;
  modelDir: string;
  algorithmTypes: string[];
  name: string;
  created: string;
  accuracy: number;
  iters: number;
  sourceId: string;
  hasMeta: boolean;
  hasWeights: boolean;
  size: number;
  lastUsed: string;
  nUsed: number;
  training: AdminModelTraining;
  protection: string[];
}

interface ModelsResponse {
  models: AdminModel[];
  totals: { count: number, size: number };
}

interface PruneResponse {
  deleted: string[];
  refused: {id: string, reason: string}[];
  freed: number;
}

interface ModelRow extends AdminModel {
  // position among the models of the same book and step, 0 = newest
  rank: number;
  label: string;
  owner: string;
}

const PROTECTION_LABELS = {
  newest: 'newest model of this book and step',
  selected: 'selected by the book',
  default_source: 'a notation style default was made from it',
  is_default: 'notation style default',
};

@Component({
    selector: 'app-administrative-view-models',
    templateUrl: './administrative-view-models.component.html',
    styleUrls: ['./administrative-view-models.component.scss'],
    standalone: false
})
export class AdministrativeViewModelsComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  readonly displayedColumns = ['select', 'owner', 'algorithm', 'created', 'lastUsed', 'nUsed',
    'accuracy', 'size', 'trainedOn', 'protection'];

  dataSource = new MatTableDataSource<ModelRow>([]);
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  loading = false;
  apiError: ApiError = null;
  totals = {count: 0, size: 0};
  selected = new Set<string>();
  matchingIds = new Set<string>();

  // prune rules
  filterText = '';
  unusedDays: number = null;
  olderThanDays: number = null;
  keepNewest = 1;
  onlyFailed = false;
  // 'candidates' reduces the table to the models the rules match; without it the matches are
  // spread over all pages of the paginator and setting a rule looks like it did nothing
  viewMode: 'all' | 'candidates' = 'all';

  ngOnInit() {
    this.dataSource.sortingDataAccessor = (row, column) => {
      switch (column) {
        case 'owner': return (row.owner || '').toLowerCase();
        case 'algorithm': return row.label.toLowerCase();
        case 'created': return row.created ? new Date(row.created).getTime() : 0;
        case 'lastUsed': return row.lastUsed ? new Date(row.lastUsed).getTime() : 0;
        case 'nUsed': return row.nUsed;
        case 'accuracy': return row.accuracy;
        case 'size': return row.size;
        default: return '';
      }
    };
    // MatTableDataSource only knows string filters, so both criteria travel as one JSON string
    this.dataSource.filterPredicate = (row, filter) => {
      const {text, onlyCandidates} = JSON.parse(filter) as {text: string, onlyCandidates: boolean};
      if (onlyCandidates && !this.matchingIds.has(row.id)) { return false; }
      return !text || row.owner.toLowerCase().includes(text) || row.label.toLowerCase().includes(text)
        || row.modelDir.toLowerCase().includes(text) || row.name.toLowerCase().includes(text);
    };
    this.refresh();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  refresh() {
    this.loading = true;
    this.selected.clear();
    this.http.get<ModelsResponse>(ServerUrls.administrative('models')).subscribe(
      r => {
        this.loading = false;
        this.totals = r.totals;
        this.dataSource.data = this.toRows(r.models);
        this.updateMatching();
      },
      error => { this.loading = false; this.apiError = error.error as ApiError; },
    );
  }

  private toRows(models: AdminModel[]): ModelRow[] {
    const rank = new Map<string, number>();
    const rows = models
      .slice()
      // newest first within a book and step, so the rank can drive "keep N newest"
      .sort((a, b) => (b.created || '').localeCompare(a.created || ''))
      .map(m => {
        const key = m.storage + '/' + (m.book || m.style) + '/' + m.modelDir;
        const next = rank.has(key) ? rank.get(key) + 1 : 0;
        rank.set(key, next);
        return {
          ...m,
          rank: next,
          label: this.labelFor(m),
          owner: m.bookName || m.book || m.style,
        } as ModelRow;
      });
    return rows;
  }

  private labelFor(m: AdminModel): string {
    for (const t of m.algorithmTypes) {
      const meta = metaForAlgorithmType.get(t as AlgorithmTypes);
      if (meta) { return meta.label; }
    }
    return m.modelDir;
  }

  applyFilter() {
    this.dataSource.filter = JSON.stringify({
      text: this.filterText.trim().toLowerCase(),
      onlyCandidates: this.viewMode === 'candidates',
    });
    // the matches are rarely on the page that is currently shown
    if (this.paginator) { this.paginator.firstPage(); }
  }

  protectionLabels(row: ModelRow): string[] {
    return row.protection.map(p => PROTECTION_LABELS[p] || p);
  }

  isProtected(row: ModelRow) { return row.protection.length > 0; }

  /** Whether the prune rules cover this model. Protected models never match. */
  matchesRules(row: ModelRow): boolean {
    if (this.isProtected(row)) { return false; }
    if (this.onlyFailed && row.hasWeights) { return false; }
    if (this.keepNewest > 0 && row.rank < this.keepNewest) { return false; }
    if (this.olderThanDays > 0 && this.daysSince(row.created) < this.olderThanDays) { return false; }
    if (this.unusedDays > 0) {
      // never used counts as unused since it was created
      const since = row.lastUsed ? this.daysSince(row.lastUsed) : this.daysSince(row.created);
      if (since < this.unusedDays) { return false; }
    }
    return true;
  }

  private daysSince(date: string): number {
    if (!date) { return Number.MAX_SAFE_INTEGER; }
    return (Date.now() - new Date(date).getTime()) / (24 * 3600 * 1000);
  }

  /** Recomputed on demand instead of per change detection: the table can hold hundreds of rows. */
  updateMatching() {
    this.matchingIds = new Set<string>(this.dataSource.data.filter(r => this.matchesRules(r)).map(r => r.id));
    this.applyFilter();   // the candidate view shows exactly these rows
  }

  isMatching(row: ModelRow) { return this.matchingIds.has(row.id); }

  selectMatching() {
    this.matchingIds.forEach(id => this.selected.add(id));
    // show what was just selected instead of leaving it on pages the user is not looking at
    if (this.matchingIds.size > 0) {
      this.viewMode = 'candidates';
      this.applyFilter();
    }
  }

  clearSelection() { this.selected.clear(); }

  /** The rows the table currently shows and that may be deleted at all. */
  private get selectableShown(): ModelRow[] {
    return this.dataSource.filteredData.filter(r => !this.isProtected(r));
  }

  get allShownSelected(): boolean {
    const shown = this.selectableShown;
    return shown.length > 0 && shown.every(r => this.selected.has(r.id));
  }

  get someShownSelected(): boolean {
    return !this.allShownSelected && this.selectableShown.some(r => this.selected.has(r.id));
  }

  toggleAllShown() {
    const shown = this.selectableShown;
    if (this.allShownSelected) {
      shown.forEach(r => this.selected.delete(r.id));
    } else {
      shown.forEach(r => this.selected.add(r.id));
    }
  }

  toggle(row: ModelRow) {
    if (this.isProtected(row)) { return; }
    if (this.selected.has(row.id)) { this.selected.delete(row.id); } else { this.selected.add(row.id); }
  }

  isSelected(row: ModelRow) { return this.selected.has(row.id); }

  get selectedSize(): number {
    return this.dataSource.data.filter(r => this.selected.has(r.id)).reduce((s, r) => s + r.size, 0);
  }

  /** "2 books · 60 pages", or an em dash for a model without a training record. */
  trainedOn(row: ModelRow): string {
    if (!row.training) { return '—'; }
    const pages = row.training.trainPages + row.training.validationPages;
    return $localize`${row.training.books} books · ${pages} pages`;
  }

  showTraining(row: ModelRow) {
    this.dialog.open(ModelTrainingDialogComponent, {
      width: '800px',
      data: {id: row.id, label: row.label, owner: row.owner} as ModelTrainingDialogData,
    });
  }

  formatSize(bytes: number): string {
    if (!bytes) { return '0 B'; }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  prune() {
    const ids = [...this.selected];
    if (ids.length === 0) { return; }
    const message = 'Delete ' + ids.length + ' models and free ' + this.formatSize(this.selectedSize)
      + '? This cannot be undone.';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: new ConfirmDialogModel('Delete models', message),
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) { return; }
      this.loading = true;
      this.http.post<PruneResponse>(ServerUrls.administrative('models/prune'), {ids}).subscribe(
        r => {
          this.lastResult = r;
          this.refresh();
        },
        error => { this.loading = false; this.apiError = error.error as ApiError; },
      );
    });
  }

  lastResult: PruneResponse = null;
}
