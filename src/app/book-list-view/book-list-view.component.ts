import { Component, OnInit, ViewContainerRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    standalone: false
})
export class BookListViewComponent implements OnInit {
  private http = inject(HttpClient);
  private modalDialog = inject(MatDialog);
  private viewRef = inject(ViewContainerRef);
  books = inject(BookListService);
  private serverState = inject(ServerStateService);
  private authentication = inject(AuthenticationService);
  globalSettings = inject(GlobalSettingsService);

  displayedColumns: string[] = ['label', 'created', 'creator', 'style'];

  get addBookAllowed() { return this.authentication.isLoggedIn(); }

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
