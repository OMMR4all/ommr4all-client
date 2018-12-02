import { Injectable } from '@angular/core';
import { Response, Headers, RequestOptions } from '@angular/http';
import { throwError } from 'rxjs';
import { ServerUrls } from '../server-urls';
import {catchError, map} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { PageResponse, BookCommunication, PageCommunication } from '../data-types/communication';

@Injectable({
  providedIn: 'root'
})
export class BookViewService {
  currentBook = new BookCommunication('');

  constructor(private http: HttpClient) {
  }

  getPages(book) {
    this.currentBook = new BookCommunication(book);
    return this.http.get<{pages: PageResponse[]}>(ServerUrls.listPages(book)).pipe(
      map(res => {
          return res.pages.map(page => new PageCommunication(this.currentBook, page.label));
      }),
      catchError((err: any) => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      }));
  }

}
