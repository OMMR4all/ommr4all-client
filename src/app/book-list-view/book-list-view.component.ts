import {Component, OnInit, ViewContainerRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AddNewDialogComponent} from './dialogs/add-new-dialog/add-new-dialog.component';
import {ConfirmDeleteBookDialogComponent} from './dialogs/confirm-delete-book-dialog/confirm-delete-book-dialog.component';
import {BookListService, BookMeta} from '../book-list.service';
import {ServerStateService} from '../server-state/server-state.service';
import {MatDialog} from '@angular/material';

@Component({
  selector: 'app-book-list-view',
  templateUrl: './book-list-view.component.html',
  styleUrls: ['./book-list-view.component.css'],
})
export class BookListViewComponent implements OnInit {
  displayedColumns: string[] = ['label', 'created', 'buttons'];

  constructor(
    private http: HttpClient,
    private modalDialog: MatDialog,
    private viewRef: ViewContainerRef,
    public books: BookListService,
    private serverState: ServerStateService,
  ) { }

  ngOnInit() {
    this.serverState.connectedToServer.subscribe(() => this.books.listBooks());
    this.books.listBooks();
  }

  onAdd() {
    const dialog = this.modalDialog.open(AddNewDialogComponent, {
      data: {
        bookName: '',
      }
    });
    dialog.afterClosed().subscribe(() => {
      this.books.listBooks();
    });
  }

  selectBook(bookId: string) {
    this.books.selectBook(bookId);
  }

  deleteBook(bookMeta: BookMeta) {
    this.modalDialog.open(ConfirmDeleteBookDialogComponent, {
      data: {
        book: bookMeta,
      }
    }).afterClosed().subscribe(() => this.books.listBooks());
  }
}
