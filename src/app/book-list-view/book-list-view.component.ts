import {Component, OnInit, ViewContainerRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AddNewDialogComponent} from './dialogs/add-new-dialog/add-new-dialog.component';
import {BookListService, BookMeta} from '../book-list.service';
import {ServerStateService} from '../server-state/server-state.service';
import { MatDialog } from '@angular/material/dialog';
import {BookPermissionFlag, BookPermissionFlags} from '../data-types/permissions';
import {GlobalSettingsService} from '../global-settings.service';
import {AuthenticationService, GlobalPermissions} from '../authentication/authentication.service';
import {ImportBookDialogComponent} from './dialogs/import-book-dialog/import-book-dialog.component';

@Component({
  selector: 'app-book-list-view',
  templateUrl: './book-list-view.component.html',
  styleUrls: ['./book-list-view.component.css'],
})
export class BookListViewComponent implements OnInit {
  displayedColumns: string[] = ['label', 'created', 'creator', 'style'];

  get addBookAllowed() { return this.authentication.isLoggedIn(); }

  constructor(
    private http: HttpClient,
    private modalDialog: MatDialog,
    private viewRef: ViewContainerRef,
    public books: BookListService,
    private serverState: ServerStateService,
    private authentication: AuthenticationService,
    public globalSettings: GlobalSettingsService,
  ) { }

  ngOnInit() {
    this.serverState.connectedToServer.subscribe(() => this.books.listBooks());
    this.books.listBooks();
  }

  onAdd() {
    const dialog = this.modalDialog.open(AddNewDialogComponent, {
      width: '400px',
    });
    dialog.afterClosed().subscribe(() => {
      this.books.listBooks();
    });
  }

  onImport() {
    const dialog = this.modalDialog.open(ImportBookDialogComponent, {
      width: '400px',
    });
    dialog.afterClosed().subscribe((r) => {
      if (r) { this.books.listBooks(); }
    });
  }

  selectBook(bookId: string) {
    this.books.selectBook(bookId);
  }

  showDelete(bookMeta: BookMeta) {
    return (new BookPermissionFlags(bookMeta.permissions)).has(BookPermissionFlag.DeleteBook);
  }
}
