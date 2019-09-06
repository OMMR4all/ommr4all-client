import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {ServerUrls} from './server-urls';
import {ServerStateService} from './server-state/server-state.service';
import {AuthenticationService} from './authentication/authentication.service';
import {BookPermissionFlag, BookPermissionFlags} from './data-types/permissions';
import {AlgorithmPredictorParams, AlgorithmTypes} from './book-view/book-step/algorithm-predictor-params';
import {objIntoEnumMap} from './utils/converting';
import {ApiError, apiErrorFromHttpErrorResponse, ErrorCodes} from './utils/api-error';
import {RestAPIUser, unknownRestAPIUser} from './authentication/user';

export class BookMeta {
  constructor(
    public id = '',
    public name = '',
    public created = '',
    public creator: RestAPIUser = unknownRestAPIUser,
    public last_opened = '',
    public permissions = 0,
    public notationStyle = '',
    public numberOfStaffLines = 4,
    private algorithmPredictorParams = new Map<AlgorithmTypes, AlgorithmPredictorParams>(),
  ) {
    if (!creator) { this.creator = unknownRestAPIUser; }
  }

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
      creator: this.creator,
      last_opened: this.last_opened,
      permissions: this.permissions,
      notationStyle: this.notationStyle,
      numberOfStaffLines: this.numberOfStaffLines,
      algorithmPredictorParams: params,
    };
  }

  copyFrom(b: BookMeta): BookMeta {
    this.id = b.id || '';
    this.name = b.name || '';
    this.created = b.created || '';
    this.creator = b.creator || unknownRestAPIUser;
    this.last_opened = b.last_opened || '';
    this.permissions = b.permissions || 0;
    this.notationStyle = b.notationStyle || '';
    this.numberOfStaffLines = b.numberOfStaffLines || 4;
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

  hasPermission(permissions: BookPermissionFlag|number) { return (new BookPermissionFlags(this.permissions)).has(permissions); }

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
  apiError: ApiError = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private serverState: ServerStateService,
    private auth: AuthenticationService,
  ) {
  }

  listBooks() {
    this.apiError = null;
    this.http.get<{books: Array<any>}>(ServerUrls.listBooks()).subscribe(
      books => {
        this.books = books.books.map(b => BookMeta.fromJson(b));
      },
      error => {
        this.apiError = apiErrorFromHttpErrorResponse(error as HttpErrorResponse);
      });
  }

  selectBook(bookId: string) {
    this.router.navigate(['book', bookId]);
  }
}
