import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {ServerUrls} from './server-urls';
import {ServerStateService} from './server-state/server-state.service';
import {AuthenticationService} from './authentication/authentication.service';
import {BookPermissionFlags} from './data-types/permissions';

export enum BookNotationStyle {
  French14 = 'french14',
}

export class BookMeta {
  constructor(
    public id = '',
    public name = '',
    public created = '',
    public last_opened = '',
    public permissions = 0,
    public notationStyle = BookNotationStyle.French14,
  ) { }

  static copy(b: BookMeta) {
    const m = new BookMeta();
    m.copyFrom(b);
    return m;
  }

  copyFrom(b: BookMeta) {
    this.id = b.id || '';
    this.name = b.name || '';
    this.created = b.created || '';
    this.last_opened = b.last_opened || '';
    this.permissions = b.permissions || 0;
    this.notationStyle = b.notationStyle || BookNotationStyle.French14;
  }

  hasPermission(permissions) { return (new BookPermissionFlags(this.permissions)).has(permissions); }
}

@Injectable({
  providedIn: 'root'
})
export class BookListService {
  books: Array<BookMeta> = [];
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private serverState: ServerStateService,
    private auth: AuthenticationService,
  ) {
  }

  listBooks() {
    this.errorMessage = '';
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

  selectBook(bookId: string) {
    this.router.navigate(['book', bookId]);
  }
}
