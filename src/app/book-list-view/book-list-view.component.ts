import {Component, ElementRef, Input, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import { Injectable } from '@angular/core';
import { ServerUrls } from '../server-urls';
import {Subject, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {ViewCompiler} from '@angular/compiler';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {ModalDialogService, SimpleModalComponent} from 'ngx-modal-dialog';
import {AddNewDialogComponent} from './dialogs/add-new-dialog/add-new-dialog.component';
import {ConfirmDeleteBookDialogComponent} from './dialogs/confirm-delete-book-dialog/confirm-delete-book-dialog.component';

class BookMeta {
  constructor(
    public id: string,
    public name: string,
    public created: string,
    ) {
  }

}

@Component({
  selector: 'app-book-list-view',
  templateUrl: './book-list-view.component.html',
  styleUrls: ['./book-list-view.component.css'],
})
export class BookListViewComponent implements OnInit {
  books: Array<BookMeta> = [];
  public errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private modalService: ModalDialogService,
    private viewRef: ViewContainerRef,
  ) { }

  ngOnInit() {
    this.list_books();
  }

  list_books() {
    this.http.get<{books: Array<BookMeta>}>(ServerUrls.listBooks()).subscribe(
      books => {
        this.books = books.books;
      },
      error => {
        const resp = error as Response;
        if (resp.status === 504) {
          this.errorMessage = 'Server is unavailable.';
        } else {
          this.errorMessage = 'Unknown server error (' + resp.status + ').';
        }

      });
  }

  onAdd() {
    this.modalService.openDialog(this.viewRef, {
      title: 'Add new book',
      childComponent: AddNewDialogComponent,
      data: {
        onAdded: (book) => this.list_books()
      }
    });
  }

  selectBook(bookId: string) {
    this.router.navigate(['book', bookId]);
  }

  deleteBook(bookMeta: BookMeta) {
    this.modalService.openDialog(this.viewRef, {
      title: 'Delete book "' + bookMeta.name + '"',
      childComponent: ConfirmDeleteBookDialogComponent,
      data: {
        book: bookMeta,
        onDeleted: () => this.list_books()
      }
    });
  }
}
