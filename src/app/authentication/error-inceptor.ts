import { Injectable, inject } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {AuthenticatedUser} from './user';
import {ALREADY_RETRIED, INTERACTIVE_AUTH} from './http-context';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private authenticationService = inject(AuthenticationService);

  /** The endpoints that hand out tokens: recovering from their 401 would recurse. */
  private isAuthEndpoint(url: string): boolean {
    return url.indexOf('/api/token/') >= 0;
  }

  /**
   * Whether a 401 means "the session is gone" rather than "you may not do this".
   *
   * The API answers both with 401, but a permission denial is an APIError and always
   * carries an errorCode (restapi/models/error.py), while an expired or missing token
   * produces DRF's bare {detail, code} body. The token body is *not* recognisable by its
   * text: simplejwt says "Given token not valid for any token type" for an expired access
   * token -- matching on the word "expired", as this interceptor used to, silently missed
   * every real expiry and left the user with a session that just stopped working.
   */
  private isSessionFailure(err: HttpErrorResponse): boolean {
    return err.status === 401 && !(err.error && err.error.errorCode);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError((err: HttpErrorResponse) => {
      if (!this.isSessionFailure(err) || this.isAuthEndpoint(request.url)
          || request.context.get(ALREADY_RETRIED)) {
        return throwError(err);
      }

      // Without a session there is nothing to recover: the 401 means "log in to do this",
      // not "your session ended", and announcing an expiry to someone who never logged in
      // is how the front page ended up telling visitors their session had expired.
      if (this.authenticationService.isLoggedOut()) {
        return throwError(err);
      }

      // Refresh the token (or let the user log in again) and replay the request, so an
      // expired session costs a password prompt instead of the work in the open editor.
      return this.authenticationService.recoverSession(request.context.get(INTERACTIVE_AUTH)).pipe(
        switchMap(recovered => recovered ? next.handle(this.reauthorized(request)) : throwError(err)),
      );
    }));
  }

  /** JwtInterceptor runs before this one and does not see a retried request, so the
   *  refreshed token has to be put on the clone here. */
  private reauthorized<T>(request: HttpRequest<T>): HttpRequest<T> {
    const context = request.context.set(ALREADY_RETRIED, true);
    const user = JSON.parse(localStorage.getItem('user')) as AuthenticatedUser;
    if (!user || !user.access) { return request.clone({context}); }
    return request.clone({
      context,
      headers: request.headers.set('Authorization', 'Bearer ' + user.access),
    });
  }
}
