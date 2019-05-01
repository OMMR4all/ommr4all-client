import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
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
    return next.handle(request).pipe(catchError(err => {
      if (err.status === 401) {
        if (this.authenticationService.isLoggedOut()) {
          // if logged out, go to login page
          this.router.navigate(['/login'], { queryParams: { redirect: this.router.url.split('?')[0] }});
        }
      }

      return throwError(err);
    }));
  }
}
