import { Injectable } from '@angular/core';
import {HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {Router} from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // either if logged out or the json token is expired redirect to login page (note this matches on the error message and might be
        // adjusted if the django rest api for json token changed
        if (this.authenticationService.isLoggedOut() || (err.error && err.error.detail && err.error.detail.indexOf('expired') >= 0)) {
          if (this.authenticationService.isLoggedIn()) {
            // if logged in and an error accurred, log out automatically
            this.authenticationService.logout();
          }
          // redirect to login page
          this.router.navigate(['/login'], { queryParams: { redirect: this.router.url.split('?')[0] }});
        }
      }

      return throwError(err);
    }));
  }
}
