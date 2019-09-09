import {EventEmitter, Injectable, Output} from '@angular/core';
import * as moment from 'moment';
import {HttpClient} from '@angular/common/http';
import {map, shareReplay} from 'rxjs/operators';
import {UserIdleService} from '../common/user-idle.service';
import {BehaviorSubject} from 'rxjs';
import {Router} from '@angular/router';
import {AuthenticatedUser} from './user';


export enum GlobalPermissions {
  AddBookStyle = 'add_book_style',
  DeleteBookStyle = 'delete_book_style',
  EditBookStyle = 'edit_book_style',
  ChangeDefaultModelForBookStyle = 'change_default_model_for_book_style',
  TasksList = 'tasks_list',
  TasksCancel = 'tasks_cancel',
}


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private _user = new BehaviorSubject<AuthenticatedUser>(JSON.parse(localStorage.getItem('user')));
  private _loggedIn = new BehaviorSubject<boolean>(!!this._user.getValue());
  get loggedInObs() { return this._loggedIn.asObservable(); }
  get userObs() { return this._user.asObservable(); }
  get user(): AuthenticatedUser { return this._user.getValue(); }
  get token() { return this.user.token; }
  hasPermission(p: GlobalPermissions|string) {
    if (!this.isLoggedIn()) { return false; }
    return this.user.permissions.find(up => up === 'database.' + p) !== undefined;
  }

  constructor(
    private http: HttpClient,
    private userIdle: UserIdleService,
    public router: Router,
  ) {
    setInterval(() => { this.refreshToken(); }, 10 * 60 * 1000);  // server delta is 120 minutes, here we refresh every 10 mins
    setTimeout(() => this.refreshToken());   // once on start
    this._user.subscribe(value => {
      if (!value) {
        localStorage.removeItem('user');
      } else {
        localStorage.setItem('user', JSON.stringify(value));
      }
    });
  }

  login(username: string, password: string ) {
    return this.http.post<AuthenticatedUser>('/api/token-auth/', {username, password}).pipe(
      map(res => this.setSession(res)),
      shareReplay(),
    );
  }

  private setSession(authResult: AuthenticatedUser) {
    this._user.next(authResult);
    if (!this._loggedIn.getValue()) { this._loggedIn.next(true); }
  }

  logout() {
    this._user.next(null);
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
      this.http.post<AuthenticatedUser>('/api/token-refresh/', {token: (JSON.parse(localStorage.getItem('user')) as AuthenticatedUser).token}).subscribe(
        res => {
          this.setSession(res);
        },
        err => {
          this.logout();
        });
    }
  }
}
