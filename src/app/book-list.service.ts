import { Injectable, inject } from '@angular/core';
import {Router} from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {ServerUrls} from './server-urls';
import {ServerStateService} from './server-state/server-state.service';
import {AuthenticationService} from './authentication/authentication.service';
import {BookPermissionFlag, BookPermissionFlags} from './data-types/permissions';
import {AlgorithmPredictorParams, AlgorithmTypes} from './book-view/book-step/algorithm-predictor-params';
import {objIntoEnumMap} from './utils/converting';
import {ApiError, apiErrorFromHttpErrorResponse, ErrorCodes} from './utils/api-error';
import {RestAPIUser, unknownRestAPIUser} from './authentication/user';
import {Observable} from 'rxjs';

export type BookState = 'empty' | 'no_transcription' | 'transcription_uncorrected' | 'partially_corrected' | 'fully_corrected';

export interface BookOverviewStats {
  pages: number;
  pagesWithSymbols: number;
  verified: number;
  locks: {StaffLines: number, Layout: number, Symbols: number, Text: number};
  percentages: {StaffLines: number, Layout: number, Symbols: number, Text: number};
  state: BookState;
}

export class BookMeta {
  constructor(
    public id = '',
    public name = '',
    public created = new Date(Date.now()).toISOString(),
    // last content modification; empty for legacy books, read-only on the client (not sent back in toJson)
    public updated = '',
    public updatedBy = '',
    public creator: RestAPIUser = unknownRestAPIUser,
    public last_opened = '',
    public permissions = 0,
    public notationStyle = '',
    public numberOfStaffLines = 4,
    private algorithmPredictorParams = new Map<AlgorithmTypes, AlgorithmPredictorParams>(),
    public dateOfOrigin = '',
    public placeOfOrigin = '',
    // Raw JSON of the configured one-click workflow (see one-click-workflow/workflow-config.ts)
    public oneClickWorkflow: any[] = null,

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
      dateOfOrigin: this.dateOfOrigin,
      placeOfOrigin: this.placeOfOrigin,
      oneClickWorkflow: this.oneClickWorkflow || [],
    };
  }

  copyFrom(b: BookMeta): BookMeta {
    this.id = b.id || '';
    this.name = b.name || '';
    this.created = b.created || '';
    this.updated = b.updated || '';
    this.updatedBy = b.updatedBy || '';
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
    this.dateOfOrigin = b.dateOfOrigin || '';
    this.placeOfOrigin = b.placeOfOrigin || '';
    this.oneClickWorkflow = (b.oneClickWorkflow && b.oneClickWorkflow.length > 0) ? b.oneClickWorkflow : null;

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
  private http = inject(HttpClient);
  private router = inject(Router);
  private serverState = inject(ServerStateService);
  private auth = inject(AuthenticationService);

  books: BookMeta[] = [];
  apiError: ApiError = null;

  listBooks(onLoaded?: () => void) {
    this.apiError = null;
    this.http.get<{books: any[]}>(ServerUrls.listBooks()).subscribe(
      books => {
        this.books = books.books.map(b => BookMeta.fromJson(b));
        if (onLoaded) { onLoaded(); }
      },
      error => {
        this.apiError = apiErrorFromHttpErrorResponse(error as HttpErrorResponse);
      }, );
  }

  getOverviewStats(bookId: string): Observable<BookOverviewStats> {
    return this.http.get<BookOverviewStats>(ServerUrls.bookOverviewStats(bookId));
  }

  selectBook(bookId: string) {
    this.router.navigate(['book', bookId]);
  }
}
