import { EventEmitter, Injectable, Output, inject } from '@angular/core';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import {catchError, distinctUntilChanged, finalize, map, shareReplay, switchMap} from 'rxjs/operators';
import {UserIdleService} from '../common/user-idle.service';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {Router} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {AuthenticatedUser} from './user';
import {SessionExpiredDialogComponent} from './session-expired-dialog/session-expired-dialog.component';


export enum GlobalPermissions {
  AddBookStyle = 'add_book_style',
  DeleteBookStyle = 'delete_book_style',
  EditBookStyle = 'edit_book_style',
  ChangeDefaultModelForBookStyle = 'change_default_model_for_book_style',
  TasksList = 'tasks_list',
  TasksCancel = 'tasks_cancel',
  SetTrainingEpochs = 'set_training_epochs',
  ViewSystemResources = 'view_system_resources',
  ManageModels = 'manage_models',
}


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private http = inject(HttpClient);
  private userIdle = inject(UserIdleService);
  private dialog = inject(MatDialog);
  router = inject(Router);

  private _user = new BehaviorSubject<AuthenticatedUser>(JSON.parse(localStorage.getItem('user')));
  private _loggedIn = new BehaviorSubject<boolean>(!!this._user.getValue());
  get loggedInObs() { return this._loggedIn.asObservable(); }
  get userObs() { return this._user.asObservable(); }
  get user(): AuthenticatedUser { return this._user.getValue(); }
  get username(): string { return this.user?.username; }
  get usernameObs() { return this._user.pipe(map(u => u?.username), distinctUntilChanged()); }
  get token() { return this.user.access; }
  hasPermission(p: GlobalPermissions|string) {
    if (!this.isLoggedIn()) { return false; }
    return this.user?.permissions.find(up => up === 'database.' + p) !== undefined;
  }
  // mirrors the server-side restapi.views.auth.is_admin: Django staff/superuser, or the
  // administrative permission granted to the user or one of their groups
  get isAdmin() { return this.isLoggedIn() && !!this.user?.is_admin; }
  hasAdminPermission(p: GlobalPermissions) { return this.isAdmin || this.hasPermission(p); }
  get mayViewSystemResources() { return this.hasAdminPermission(GlobalPermissions.ViewSystemResources); }
  get mayManageModels() { return this.hasAdminPermission(GlobalPermissions.ManageModels); }
  // note: whether the epoch count may be raised (GlobalPermissions.SetTrainingEpochs) is not
  // decided here -- the train view takes the limit from the server's train_params endpoint

  constructor() {
    setInterval(() => { this.refreshToken(); }, 10 * 60 * 1000);  // server delta is 120 minutes, here we refresh every 10 mins
    setTimeout(() => this.refreshToken());   // once on start
    setTimeout(() => this.ensureIdentity());
    this._user.subscribe(value => {
      if (!value) {
        localStorage.removeItem('user');
      } else {
        localStorage.setItem('user', JSON.stringify(value));
      }
    });
  }

  login(username: string, password: string ) {
    return this.http.post<AuthenticatedUser>('/api/token/', {username, password}).pipe(
      map(res => this.setSession(res)),
      shareReplay(),
    );
  }

  private setSession(authResult: AuthenticatedUser) {
    let user: AuthenticatedUser;

    if ('access' in authResult && !('permissions' in authResult)) {
      // Token refresh - nur access token erhalten
      const refreshResult = authResult as {access: string};

      user = {
        ...this._user.getValue(),
        access: refreshResult.access
      };
    } else {
      // Vollständiger Login
      user = authResult as AuthenticatedUser;
    }
    this._user.next(user);
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

  /** Sessions stored before the username was part of the login response only ever get a
   *  new access token on refresh, so they would never learn who they belong to. */
  private ensureIdentity() {
    if (!this.isLoggedIn() || this.username) { return; }
    this.http.get<{username: string, firstName: string, lastName: string}>('/api/user/me').subscribe(
      me => {
        const user = this._user.getValue();
        if (user) { this._user.next({...user, ...me}); }
      },
      // best effort: without it only the assignment highlighting stays generic
      () => undefined,
    );
  }

  private refreshToken() {
    if (this.isLoggedIn() && !this.userIdle.isTimedOut) {
      // A failure here no longer logs the user out: dropping the session in the background
      // is what used to make the editor stop saving without ever saying so. If the token is
      // really gone, the next request answers 401 and recoverSession() takes over.
      this.refresh().subscribe();
    }
  }

  /** Exchange the refresh token for a new access token. Emits whether that worked. */
  private refresh(): Observable<boolean> {
    const user = this._user.getValue();
    if (!user || !user.refresh) { return of(false); }
    return this.http.post<AuthenticatedUser>('/api/token/refresh/', {refresh: user.refresh}).pipe(
      map(res => { this.setSession(res); return true; }),
      catchError(() => of(false)),
    );
  }

  /**
   * Get the session working again after a request came back 401, without navigating away.
   *
   * The refresh token outlives the access token by days, so most expiries are repaired
   * silently; only if that fails is the user asked for their password, in a dialog that
   * leaves the open page (and its unsaved changes) alone. Emits true when the caller may
   * retry its request. Concurrent callers -- the autosave, the task poller, the page lock --
   * share one recovery, so they produce a single dialog.
   */
  private _recovery: Observable<boolean> = null;
  recoverSession(): Observable<boolean> {
    if (this._recovery) { return this._recovery; }
    this._recovery = this.refresh().pipe(
      switchMap(refreshed => refreshed ? of(true) : this.askForCredentials()),
      finalize(() => this._recovery = null),
      shareReplay(1),
    );
    return this._recovery;
  }

  private askForCredentials(): Observable<boolean> {
    this.logout();
    return this.dialog.open(SessionExpiredDialogComponent, {
      width: '400px',
      disableClose: true,
    }).afterClosed().pipe(
      map(loggedIn => {
        if (loggedIn) { return true; }
        // declined: fall back to the login page, as before
        const url = this.router.url.split('?')[0];
        if (!url.startsWith('/login')) {
          this.router.navigate(['/login'], {queryParams: {redirect: url}});
        }
        return false;
      }),
    );
  }
}
