import { EventEmitter, Injectable, Output, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {catchError, distinctUntilChanged, finalize, map, shareReplay, switchMap} from 'rxjs/operators';
import {UserIdleService} from '../common/user-idle.service';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {Router} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {AuthenticatedUser} from './user';
import {SessionExpiredDialogComponent} from './session-expired-dialog/session-expired-dialog.component';


/**
 * Whether a JWT can no longer be used, judged locally from its `exp` claim.
 *
 * This is deliberately not a security check -- only the server decides that -- it exists so
 * a session that provably cannot be revived is dropped before the app sends a request with
 * it. Anything that does not parse counts as expired: a token this code cannot read is one
 * the server will reject anyway.
 */
export function jwtExpired(token: string): boolean {
  if (!token) { return true; }
  const parts = token.split('.');
  if (parts.length !== 3) { return true; }
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number') { return true; }
    return payload.exp <= Date.now() / 1000;
  } catch {
    return true;
  }
}


/** The stored session, or null when there is none that could still be revived. */
function restoreSession(): AuthenticatedUser {
  let user: AuthenticatedUser;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }
  // The refresh token is what recovery runs on; once it is gone the session is over, no
  // matter how the stored object looks. Reporting it as logged in used to make the app
  // fire requests with a dead token on every route -- including the front page, where the
  // resulting 401 was announced as an expired session to a user who was just visiting.
  if (!user || jwtExpired(user.refresh)) {
    localStorage.removeItem('user');
    return null;
  }
  return user;
}


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
  private snackBar = inject(MatSnackBar);
  router = inject(Router);

  private _user = new BehaviorSubject<AuthenticatedUser>(restoreSession());
  private _loggedIn = new BehaviorSubject<boolean>(!!this._user.getValue());
  get loggedInObs() { return this._loggedIn.asObservable(); }
  get userObs() { return this._user.asObservable(); }
  get user(): AuthenticatedUser { return this._user.getValue(); }
  get username(): string { return this.user?.username; }
  get usernameObs() { return this._user.pipe(map(u => u?.username), distinctUntilChanged()); }
  get token() { return this.user?.access; }
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
    // ensureIdentity() waits for a successful initial refresh instead of racing it: firing
    // it with a stale access token is what turned every page load on an old session into a
    // 401, and on the front page that 401 became an unprompted "session expired".
    setTimeout(() => this.refreshToken(() => this.ensureIdentity()));
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

  /** @param onRefreshed runs only once there is a usable access token again. */
  private refreshToken(onRefreshed?: () => void) {
    if (this.isLoggedIn() && !this.userIdle.isTimedOut) {
      // A failure here no longer logs the user out: dropping the session in the background
      // is what used to make the editor stop saving without ever saying so. A refresh also
      // fails on a plain network blip, so nothing is concluded from it -- if the token is
      // really gone, the next request answers 401 and recoverSession() takes over.
      this.refresh().subscribe(ok => { if (ok && onRefreshed) { onRefreshed(); } });
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
   * silently. When that fails the outcome depends on what was waiting: an `interactive`
   * request (the editor's save, its page lock) is worth a password dialog that leaves the
   * open page and its unsaved changes alone, while everything else just ends the session
   * and says so in a snackbar. Emits true when the caller may retry its request.
   * Concurrent callers share one recovery, so they produce a single prompt.
   */
  private _recovery: Observable<boolean> = null;
  recoverSession(interactive: boolean): Observable<boolean> {
    if (this._recovery) { return this._recovery; }
    this._recovery = this.refresh().pipe(
      switchMap(refreshed => {
        if (refreshed) { return of(true); }
        return interactive ? this.askForCredentials() : of(this.expireSession());
      }),
      finalize(() => this._recovery = null),
      // refCount:false so that the finalize above cannot run -- and null _recovery
      // mid-flight, letting a second prompt open -- when every subscriber unsubscribes.
      shareReplay({bufferSize: 1, refCount: false}),
    );
    return this._recovery;
  }

  /**
   * End the session and tell the user, without taking the page away from them.
   *
   * Used for expiries nobody was waiting on and for the idle timeout. The snackbar offers
   * the way back instead of navigating there: whatever is on screen may still be worth
   * reading, and public pages stay perfectly usable logged out.
   */
  expireSession(): false {
    if (this.isLoggedOut()) { return false; }
    this.logout();
    const url = this.router.url.split('?')[0];
    const ref = this.snackBar.open(
      $localize`:@@sessionEndedNotice:Your session has ended. Log in again to continue working.`,
      $localize`:@@Login:Login`,
      {duration: 10000},
    );
    ref.onAction().subscribe(() => {
      if (!url.startsWith('/login')) {
        this.router.navigate(['/login'], {queryParams: {redirect: url}});
      }
    });
    return false;
  }

  private askForCredentials(): Observable<boolean> {
    // read before logging out, which drops the user object the name comes from
    const username = this.username;
    this.logout();
    return this.dialog.open(SessionExpiredDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {username},
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
