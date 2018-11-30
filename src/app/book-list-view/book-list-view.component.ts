import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import { Injectable } from '@angular/core';
import { ServerUrls } from '../server-urls';
import {throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {ViewCompiler} from '@angular/compiler';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';

class BookMeta {
  constructor(
    public id: string,
    public name: string,
    ) {
  }

}

@Component({
  selector: 'app-book-list-view',
  templateUrl: './book-list-view.component.html',
  styleUrls: ['./book-list-view.component.css']
})
export class BookListViewComponent implements OnInit {
  @ViewChild('bookName') bookNameField: ElementRef;
  books: Array<BookMeta> = [];
  private _errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) { }

  ngOnInit() {
    this.list_books();
  }

  list_books() {
    this.http.get<{books: Array<BookMeta>}>(ServerUrls.list_books()).subscribe(
      books => {
        this.books = books.books;
        console.log(books);
      },
      error => { this._errorMessage = <any>error; });
  }

  onAdd(newBookName: string) {
    this.http.post(ServerUrls.add_book(), {'name': newBookName}).subscribe(
      books => {
        this.list_books();
        this.bookNameField.nativeElement.value = '';
      },
      error => { this._errorMessage = error; }
    );
  }

  selectBook(bookName: string) {
    this.router.navigate(['book', bookName]);
  }
}
