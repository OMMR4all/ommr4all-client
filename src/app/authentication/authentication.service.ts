import {EventEmitter, Injectable, Output} from '@angular/core';
import * as moment from 'moment';
import {HttpClient} from '@angular/common/http';
import {map, shareReplay} from 'rxjs/operators';
import {UserIdleService} from '../common/user-idle.service';
import {BehaviorSubject} from 'rxjs';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private _token = new BehaviorSubject<string>(localStorage.getItem('id_token'));
  private _loggedIn = new BehaviorSubject<boolean>(!!this._token.getValue());
  get loggedInObs() { return this._loggedIn.asObservable(); }
  get tokenObs() { return this._token.asObservable(); }
  get token() { return this._token.getValue(); }

  constructor(
    private http: HttpClient,
    private userIdle: UserIdleService,
    public router: Router,
  ) {
    setInterval(() => { this.refreshToken(); }, 10 * 60 * 1000);  // server delta is 120 minutes
    this.loggedInObs.subscribe((loggedIn) => {
      if (!loggedIn) { router.navigateByUrl('logout'); }
    });
    this._token.asObservable().subscribe(value => {
      if (!value) {
        localStorage.removeItem('id_token');
      } else {
        localStorage.setItem('id_token', value);
      }
    });
  }

  login(username: string, password: string ) {
    return this.http.post<{token}>('/api/token-auth/', {username, password}).pipe(
      map(res => this.setSession(res)),
      shareReplay(),
    );
  }

  private setSession(authResult: {token}) {
    this._token.next(authResult.token);
    if (!this._loggedIn.getValue()) { this._loggedIn.next(true); }
  }

  logout() {
    this._token.next(null);
    if (this._loggedIn.getValue()) { this._loggedIn.next(false); }
  }

  public isLoggedIn() {
    return this._loggedIn.getValue();
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }

  private refreshToken() {
    if (this.isLoggedIn() && !this.userIdle.isTimedOut) {
      this.http.post<{token}>('/api/token-refresh/', {token: localStorage.getItem('id_token')}).subscribe(
        res => {
          this.setSession(res);
        },
        err => {
          this.logout();
        });
    }
  }
}
