import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { ServerUrls } from '../../server-urls';
import {catchError, map} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {PageResponse, PageCommunication, BookCommunication} from '../../data-types/communication';

@Injectable({
  providedIn: 'root'
})
export class PagesPreviewService {
  constructor(private http: HttpClient) {
  }

  getPages(book: BookCommunication) {
    return this.http.get<{pages: PageResponse[]}>(ServerUrls.listPages(book.book)).pipe(
      map(res => res.pages.map(page => new PageCommunication(book, page.label))),
      catchError((err: any) => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      }));
  }

}

