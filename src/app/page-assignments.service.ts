import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, Subscription, of} from 'rxjs';
import {catchError, map, shareReplay, tap} from 'rxjs/operators';
import {BookCommunication} from './data-types/communication';
import {PageAssignmentsIndex, PageAssignmentsResponse} from './data-types/page-assignments';
import {ServerStateService} from './server-state/server-state.service';
import {ApiError, apiErrorFromHttpErrorResponse} from './utils/api-error';

/**
 * The page assignments of the currently opened book.
 *
 * One response feeds the content view, the editor sidebar and the overview, so the
 * concurrent subscribers of a single book share one request (see _inflight).
 */
@Injectable({
  providedIn: 'root'
})
export class PageAssignmentsService {
  private http = inject(HttpClient);
  private serverState = inject(ServerStateService);

  private _subscriptions = new Subscription();
  private _book: BookCommunication = null;
  private _state = new BehaviorSubject<PageAssignmentsIndex>(null);
  private _error = new BehaviorSubject<ApiError>(null);
  private _inflight: Observable<PageAssignmentsIndex> = null;
  /** The overview asks the server to re-sync the page index; the highlight consumers
   *  read the stored values, which keeps a plain page view from writing to the database. */
  private _sync = false;

  constructor() {
    this._subscriptions.add(this.serverState.connectedToServer.subscribe(() => this.reload()));
  }

  get stateObs() { return this._state.asObservable(); }
  get stateVal() { return this._state.getValue(); }
  get errorObs() { return this._error.asObservable(); }
  get book() { return this._book; }

  select(book: BookCommunication) {
    if (!book || book.book.length === 0) { return; }
    if (this._book && this._book.equals(book)) { return; }
    this._book = book;
    this._state.next(null);
    this._error.next(null);
    this._inflight = null;
    this.load().subscribe({next: () => undefined, error: () => undefined});
  }

  deselect() {
    this._book = null;
    this._inflight = null;
    this._state.next(null);
    this._error.next(null);
  }

  /** Select the book, or refresh it when it is already selected -- called whenever a view
   *  that shows assignments is (re)opened, so it never renders a stale set. */
  selectOrRefresh(book: BookCommunication, sync = false) {
    if (!book || book.book.length === 0) { return; }
    this._sync = sync;
    if (this._book && this._book.equals(book)) { this.reload(); } else { this.select(book); }
  }

  /** Refetch, e.g. after an assignment was created, changed or deleted. */
  reload() {
    this._inflight = null;
    this.load().subscribe({next: () => undefined, error: () => undefined});
  }

  load(): Observable<PageAssignmentsIndex> {
    if (!this._book) { return of(null); }
    if (this._inflight) { return this._inflight; }
    const book = this._book;
    const url = book.assignmentsUrl() + (this._sync ? '?sync=1' : '');
    this._inflight = this.http.get<PageAssignmentsResponse>(url).pipe(
      map(response => new PageAssignmentsIndex(response)),
      tap(index => {
        if (this._book && this._book.equals(book)) {   // a later select() wins
          this._error.next(null);
          this._state.next(index);
        }
      }),
      catchError(error => {
        this._inflight = null;
        this._error.next(apiErrorFromHttpErrorResponse(error));
        throw error;
      }),
      shareReplay(1),
    );
    return this._inflight;
  }
}
