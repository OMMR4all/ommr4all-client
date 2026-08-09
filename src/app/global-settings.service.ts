import { Injectable, inject } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {ServerUrls} from './server-urls';
import {AuthenticationService} from './authentication/authentication.service';
import {filter} from 'rxjs/operators';

export interface BookStyle {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSettingsService {
  private http = inject(HttpClient);
  private authentication = inject(AuthenticationService);

  bookStylesObs = new BehaviorSubject<BookStyle[]>([]);
  get bookStyles() { return this.bookStylesObs.getValue(); }

  // The style dropdowns are fed exclusively from this list. An empty list renders
  // a mat-select that opens a zero-height panel, which is indistinguishable from a
  // select that does not open at all -- so the two states are tracked explicitly and
  // the forms show a hint instead of a dead control.
  private _loaded = false;
  private _loadError = '';
  get bookStylesLoaded() { return this._loaded; }
  get bookStylesError() { return this._loadError; }
  get hasBookStyles() { return this.bookStyles.length > 0; }

  // NOTE: intentionally not tied to _loaded -- the administrative view gates its whole
  // content on this and must not stay blank while (or if) the request is pending.
  get isInitialized() {
    return !!this.bookStyles;
  }

  constructor() {
    const authentication = this.authentication;

    this.reloadBookStyles();
    authentication.loggedInObs.pipe(
      filter(l => l)
    ).subscribe(l => this.reloadBookStyles());
  }

  public reloadBookStyles() {
    this.http.get<BookStyle[]>(ServerUrls.bookStyles()).subscribe(
      r => {
        this._loaded = true;
        // a proxy that answers with HTML instead of JSON would otherwise break the @for
        this._loadError = Array.isArray(r) ? '' : 'unexpected response';
        this.bookStylesObs.next(Array.isArray(r) ? r : []);
      },
      err => {
        // keep the previous list, but remember why it may be empty
        this._loaded = true;
        this._loadError = err && err.status ? 'HTTP ' + err.status : 'request failed';
        console.error('Could not load the book styles', err);
      }
    );
  }

  public bookStyleById(id: string): BookStyle {
    return this.bookStyles.find(s => s.id === id);
  }
}
