import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { throwError } from 'rxjs';
import { ServerUrlsService } from '../server-urls.service';
import {catchError, map} from 'rxjs/operators';
import {HttpErrorResponse} from '@angular/common/http';

export class PagePreview {
  constructor(public id: number, public preview: string) {}
}

@Injectable({
  providedIn: 'root'
})
export class PagesPreviewService {
  constructor(private http: Http, private serverUrls: ServerUrlsService) {
  }

  getPages(book) {
    return this.http.get(this.serverUrls.list_pages(book)).pipe(
      map((res: any) => <PagePreview[]> res.json().pages),
      catchError((err: any) => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      }));
  }

}

