import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
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
  bookStylesObs = new BehaviorSubject<Array<BookStyle>>(null);
  get bookStyles() { return this.bookStylesObs.getValue(); }

  get isInitialized() {
    return !!this.bookStyles;
  }

  constructor(
    private http: HttpClient,
    private authentication: AuthenticationService,
  ) {
    this.reloadBookStyles();
    authentication.loggedInObs.pipe(
      filter(l => l)
    ).subscribe(l => this.reloadBookStyles());
  }

  public reloadBookStyles() {
    this.http.get<Array<BookStyle>>(ServerUrls.bookStyles()).subscribe(
      r => this.bookStylesObs.next(r)
    );
  }

  public bookStyleById(id: string): BookStyle {
    return this.bookStyles.find(s => s.id === id);
  }
}
