import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import { Injectable } from '@angular/core';
import { ServerUrls } from '../server-urls';
import {throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Http} from '@angular/http';
import {FormControl} from '@angular/forms';
import {ViewCompiler} from '@angular/compiler';
import {Router} from '@angular/router';

class Book {
  constructor(public label: string) {
  }

}

export class Books {
  constructor(
    public books: Book[],
  ) {}
}

@Component({
  selector: 'app-book-list-view',
  templateUrl: './book-list-view.component.html',
  styleUrls: ['./book-list-view.component.css']
})
export class BookListViewComponent implements OnInit {
  @ViewChild('bookName') bookNameField: ElementRef;
  books = new Books([]);
  private _errorMessage = '';

  constructor(
    private http: Http,
    private router: Router,
  ) { }

  ngOnInit() {
    this.list_books();
  }

  list_books() {
    this.http.get(ServerUrls.list_books()).pipe(
      map((res: any) => res.json() as Books),
      catchError(err => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      })
    ).subscribe(
      books => {
        this.books = books as Books;
        console.log(books);
      },
      error => { this._errorMessage = <any>error; });
  }

  onAdd(newBookName: string) {
    this.http.get(ServerUrls.add_book(newBookName)).pipe(
      map(res => res),
      catchError(err => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      })
    ).subscribe(
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
