import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AddNewDialogComponent} from './dialogs/add-new-dialog/add-new-dialog.component';
import {BookListService, BookMeta, BookOverviewStats, BookState} from '../book-list.service';
import {ServerStateService} from '../server-state/server-state.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import {BookPermissionFlag, BookPermissionFlags} from '../data-types/permissions';
import {GlobalSettingsService} from '../global-settings.service';
import {AuthenticationService} from '../authentication/authentication.service';
import {ImportBookDialogComponent} from './dialogs/import-book-dialog/import-book-dialog.component';

export interface BookRow {
  meta: BookMeta;
  stats: BookOverviewStats | null;
  statsError: boolean;
}

const VIEW_STATE_STORAGE_KEY = 'ommr4all-book-list-view-state';

interface StoredViewState {
  filterText?: string;
  filterStyle?: string;
  filterState?: BookState | '';
  sortActive?: string;
  sortDirection?: 'asc' | 'desc' | '';
}

@Component({
    selector: 'app-book-list-view',
    templateUrl: './book-list-view.component.html',
    styleUrls: ['./book-list-view.component.css'],
    standalone: false
})
export class BookListViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private modalDialog = inject(MatDialog);
  private viewRef = inject(ViewContainerRef);
  books = inject(BookListService);
  private serverState = inject(ServerStateService);
  private authentication = inject(AuthenticationService);
  globalSettings = inject(GlobalSettingsService);

  displayedColumns: string[] = ['label', 'created', 'updated', 'creator', 'style', 'pages', 'progress', 'state'];
  dataSource = new MatTableDataSource<BookRow>([]);
  @ViewChild(MatSort) sort: MatSort;

  readonly allStates: BookState[] = ['empty', 'no_transcription', 'transcription_uncorrected', 'partially_corrected', 'fully_corrected'];

  filterText = '';
  filterStyle = '';
  filterState: BookState | '' = '';

  private readonly subscriptions = new Subscription();
  private storedSort: {active: string, direction: 'asc' | 'desc'} = null;

  get addBookAllowed() { return this.authentication.isLoggedIn(); }

  ngOnInit() {
    this.restoreViewState();

    this.dataSource.sortingDataAccessor = (row: BookRow, column: string) => {
      switch (column) {
        case 'label': return row.meta.name.toLowerCase();
        case 'created': return new Date(row.meta.created).getTime();
        case 'updated': return row.meta.updated ? new Date(row.meta.updated).getTime() : 0;
        case 'creator': return this.creatorOf(row.meta).toLowerCase();
        case 'style': return this.styleOf(row.meta).toLowerCase();
        case 'pages': return row.stats ? row.stats.pages : -1;
        case 'progress': return row.stats
          ? (row.stats.percentages.StaffLines + row.stats.percentages.Layout
             + row.stats.percentages.Symbols + row.stats.percentages.Text) / 4
          : -1;
        case 'state': return row.stats ? this.allStates.indexOf(row.stats.state) : -1;
        default: return '';
      }
    };
    this.dataSource.filterPredicate = (row: BookRow, filter: string) => {
      const f = JSON.parse(filter) as {text: string, style: string, state: string};
      if (f.text) {
        const text = f.text.toLowerCase();
        if (!row.meta.name.toLowerCase().includes(text) && !this.creatorOf(row.meta).toLowerCase().includes(text)) {
          return false;
        }
      }
      if (f.style && row.meta.notationStyle !== f.style) { return false; }
      if (f.state) {
        // errored rows have no known state and must not slip through a specific
        // state filter; rows still loading pass to avoid flickering out
        if (row.statsError) { return false; }
        if (row.stats && row.stats.state !== f.state) { return false; }
      }
      return true;
    };

    this.subscriptions.add(this.serverState.connectedToServer.subscribe(() => this.reload()));
    this.updateFilter();
    this.reload();
  }

  ngAfterViewInit() {
    if (this.storedSort) {
      this.sort.active = this.storedSort.active;
      this.sort.direction = this.storedSort.direction;
    }
    this.dataSource.sort = this.sort;
    this.subscriptions.add(this.sort.sortChange.subscribe(() => this.storeViewState()));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  reload() {
    this.books.listBooks(() => {
      const rows = this.books.books.map(meta => ({meta, stats: null, statsError: false} as BookRow));
      this.dataSource.data = rows;
      this.books.getAllOverviewStats().subscribe(
        stats => {
          rows.forEach(row => {
            const s = stats[row.meta.id];
            if (s) { row.stats = s; } else { row.statsError = true; }
          });
          this.refresh();
        },
        () => {
          // older servers lack the batch endpoint: fall back to one request per book
          rows.forEach(row => this.loadStats(row));
        });
    });
  }

  private loadStats(row: BookRow) {
    this.books.getOverviewStats(row.meta.id).subscribe(
      stats => {
        row.stats = stats;
        this.refresh();
      },
      () => {
        row.statsError = true;
        this.refresh();
      });
  }

  private refresh() {
    // reassign so MatTableDataSource re-applies sorting/filtering on the async stats
    this.dataSource.data = this.dataSource.data.slice();
  }

  updateFilter() {
    this.dataSource.filter = JSON.stringify({text: this.filterText.trim(), style: this.filterStyle, state: this.filterState});
    this.storeViewState();
  }

  toggleStateFilter(event: MouseEvent, state: BookState) {
    event.stopPropagation();  // do not navigate into the book
    this.filterState = this.filterState === state ? '' : state;
    this.updateFilter();
  }

  private restoreViewState() {
    try {
      const stored = JSON.parse(localStorage.getItem(VIEW_STATE_STORAGE_KEY) || '{}') as StoredViewState;
      this.filterText = stored.filterText || '';
      this.filterStyle = stored.filterStyle || '';
      this.filterState = stored.filterState || '';
      if (stored.sortActive && stored.sortDirection) {
        this.storedSort = {active: stored.sortActive, direction: stored.sortDirection};
      }
    } catch {
      // ignore corrupt stored state
    }
  }

  private storeViewState() {
    const sort: Sort = this.sort ? {active: this.sort.active, direction: this.sort.direction} : {active: '', direction: ''};
    const state: StoredViewState = {
      filterText: this.filterText.trim(),
      filterStyle: this.filterStyle,
      filterState: this.filterState,
      sortActive: sort.active,
      sortDirection: sort.direction,
    };
    try {
      localStorage.setItem(VIEW_STATE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full/unavailable: the view state is a convenience only
    }
  }

  creatorOf(meta: BookMeta) {
    return meta.creator.firstName + ' ' + meta.creator.lastName + (meta.creator.username ? ' (' + meta.creator.username + ')' : '');
  }

  styleOf(meta: BookMeta) {
    const style = this.globalSettings.bookStyleById(meta.notationStyle);
    return style ? style.name : meta.notationStyle;
  }

  onAdd() {
    const dialog = this.modalDialog.open(AddNewDialogComponent, {
      width: '400px',
    });
    dialog.afterClosed().subscribe(() => {
      this.reload();
    });
  }

  onImport() {
    const dialog = this.modalDialog.open(ImportBookDialogComponent, {
      width: '400px',
    });
    dialog.afterClosed().subscribe((r) => {
      if (r) { this.reload(); }
    });
  }

  selectBook(bookId: string) {
    this.books.selectBook(bookId);
  }

  showDelete(bookMeta: BookMeta) {
    return (new BookPermissionFlags(bookMeta.permissions)).has(BookPermissionFlag.DeleteBook);
  }
}
