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
      r => this.bookStylesObs.next(r)
    );
  }

  public bookStyleById(id: string): BookStyle {
    return this.bookStyles.find(s => s.id === id);
  }
}
