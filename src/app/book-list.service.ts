import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {ServerUrls} from './server-urls';
import {ServerStateService} from './server-state/server-state.service';
import {AuthenticationService} from './authentication/authentication.service';
import {BookPermissionFlags} from './data-types/permissions';
import {AlgorithmPredictorParams, AlgorithmTypes} from './book-view/book-step/algorithm-predictor-params';
import {mapToObj, objIntoEnumMap, objIntoMap} from './utils/converting';

export class BookMeta {
  constructor(
    public id = '',
    public name = '',
    public created = '',
    public last_opened = '',
    public permissions = 0,
    public notationStyle = '',
    private algorithmPredictorParams = new Map<AlgorithmTypes, AlgorithmPredictorParams>(),
  ) { }

  static copy(b: BookMeta) {
    const m = new BookMeta();
    m.copyFrom(b);
    return m;
  }

  static fromJson(d: any) {
    return new BookMeta().copyFrom(d);
  }

  toJson() {
    const params = Object.create(null);
    this.algorithmPredictorParams.forEach((v, k) => params[k] = v);
    return {
      id: this.id,
      name: this.name,
      created: this.created,
      last_opened: this.last_opened,
      permissions: this.permissions,
      notationStyle: this.notationStyle,
      algorithmPredictorParams: params,
    };
  }

  copyFrom(b: BookMeta): BookMeta {
    this.id = b.id || '';
    this.name = b.name || '';
    this.created = b.created || '';
    this.last_opened = b.last_opened || '';
    this.permissions = b.permissions || 0;
    this.notationStyle = b.notationStyle || '';
    this.algorithmPredictorParams = new Map<AlgorithmTypes, AlgorithmPredictorParams>();
    let copyFromParams = b.algorithmPredictorParams || new Map<AlgorithmTypes, AlgorithmPredictorParams>();
    if (!(copyFromParams instanceof Map)) {
      copyFromParams = new Map<AlgorithmTypes, AlgorithmPredictorParams>();
      objIntoEnumMap(b.algorithmPredictorParams, copyFromParams, AlgorithmTypes, false);
    }
    copyFromParams.forEach((v, k) => {
      const newParams = new AlgorithmPredictorParams();
      Object.assign(newParams, v);
      this.algorithmPredictorParams.set(k, newParams);
    });
    return this;
  }

  hasPermission(permissions) { return (new BookPermissionFlags(this.permissions)).has(permissions); }

  getAlgorithmParams(p: AlgorithmTypes): AlgorithmPredictorParams {
    if (!this.algorithmPredictorParams.has(p)) { this.algorithmPredictorParams.set(p, new AlgorithmPredictorParams()); }
    return this.algorithmPredictorParams.get(p);
  }
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
