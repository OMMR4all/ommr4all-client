import {Component, OnInit, ViewContainerRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ModalDialogService} from 'ngx-modal-dialog';
import {AddNewDialogComponent} from './dialogs/add-new-dialog/add-new-dialog.component';
import {ConfirmDeleteBookDialogComponent} from './dialogs/confirm-delete-book-dialog/confirm-delete-book-dialog.component';
import {BookListService, BookMeta} from '../book-list.service';
import {ServerStateService} from '../server-state/server-state.service';

@Component({
  selector: 'app-book-list-view',
  templateUrl: './book-list-view.component.html',
  styleUrls: ['./book-list-view.component.css'],
})
export class BookListViewComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private modalService: ModalDialogService,
    private viewRef: ViewContainerRef,
    public books: BookListService,
    private serverState: ServerStateService,
  ) { }

  ngOnInit() {
    this.serverState.connectedToServer.subscribe(() => this.books.listBooks());
    this.books.listBooks();
  }

  onAdd() {
    this.modalService.openDialog(this.viewRef, {
      title: 'Add new book',
      childComponent: AddNewDialogComponent,
      data: {
        onAdded: (book) => this.books.listBooks()
      }
    });
  }

  selectBook(bookId: string) {
    this.books.selectBook(bookId);
  }

  deleteBook(bookMeta: BookMeta) {
    this.modalService.openDialog(this.viewRef, {
      title: 'Delete book "' + bookMeta.name + '"',
      childComponent: ConfirmDeleteBookDialogComponent,
      data: {
        book: bookMeta,
        onDeleted: () => this.books.listBooks()
      }
    });
  }
}
