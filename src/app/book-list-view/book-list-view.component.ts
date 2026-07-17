import { AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AddNewDialogComponent} from './dialogs/add-new-dialog/add-new-dialog.component';
import {BookListService, BookMeta, BookOverviewStats, BookState} from '../book-list.service';
import {ServerStateService} from '../server-state/server-state.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import {BookPermissionFlag, BookPermissionFlags} from '../data-types/permissions';
import {GlobalSettingsService} from '../global-settings.service';
import {AuthenticationService} from '../authentication/authentication.service';
import {ImportBookDialogComponent} from './dialogs/import-book-dialog/import-book-dialog.component';

export interface BookRow {
  meta: BookMeta;
  stats: BookOverviewStats;
  statsError: boolean;
}

@Component({
    selector: 'app-book-list-view',
    templateUrl: './book-list-view.component.html',
    styleUrls: ['./book-list-view.component.css'],
    standalone: false
})
export class BookListViewComponent implements OnInit, AfterViewInit {
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

  get addBookAllowed() { return this.authentication.isLoggedIn(); }

  ngOnInit() {
    this.dataSource.sortingDataAccessor = (row: BookRow, column: string) => {
      switch (column) {
        case 'label': return row.meta.name.toLowerCase();
        case 'created': return new Date(row.meta.created).getTime();
        case 'updated': return row.meta.updated ? new Date(row.meta.updated).getTime() : 0;
        case 'creator': return this.creatorOf(row.meta).toLowerCase();
        case 'style': return this.styleOf(row.meta).toLowerCase();
        case 'pages': return row.stats ? row.stats.pages : -1;
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
      // rows whose stats are still loading pass the state filter to avoid flickering out
      if (f.state && row.stats && row.stats.state !== f.state) { return false; }
      return true;
    };

    this.serverState.connectedToServer.subscribe(() => this.reload());
    this.reload();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  reload() {
    this.books.listBooks(() => {
      this.dataSource.data = this.books.books.map(meta => ({meta, stats: null, statsError: false} as BookRow));
      this.dataSource.data.forEach(row => this.loadStats(row));
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
