import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import {AuthenticatedUser} from './user';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    const idToken = JSON.parse(localStorage.getItem('user')) as AuthenticatedUser;
    console.log('intercepter');

    console.log(idToken);
    console.log("intercepter23");

    //console.log(idToken.token);
    if (idToken && idToken.token) {
      const cloned = request.clone({
        headers: request.headers.set('Authorization', 'Bearer ' + idToken.token)
      });
      return next.handle(cloned);
    }

    return next.handle(request);
  }
}
