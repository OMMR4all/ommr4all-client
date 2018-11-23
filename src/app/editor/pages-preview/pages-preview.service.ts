import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { throwError } from 'rxjs';
import { ServerUrls } from '../../server-urls';
import {catchError, map} from 'rxjs/operators';
import {HttpErrorResponse} from '@angular/common/http';
import {PageResponse, PageCommunication, BookCommunication} from '../../data-types/communication';

@Injectable({
  providedIn: 'root'
})
export class PagesPreviewService {
  constructor(private http: Http) {
  }

  getPages(book: BookCommunication) {
    return this.http.get(ServerUrls.list_pages(book.book)).pipe(
      map((res: any) => {
          const resp = res.json()['pages'] as PageResponse[];
          return resp.map(page => new PageCommunication(book, page.label));
        }),
      catchError((err: any) => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      }));
  }

}

