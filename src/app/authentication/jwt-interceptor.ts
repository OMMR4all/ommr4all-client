import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    const idToken = localStorage.getItem('id_token');
    if (idToken) {
      const cloned = request.clone({
        headers: request.headers.set('Authorization', 'JWT ' + idToken)
      });
      return next.handle(cloned);
    }

    return next.handle(request);
  }
}
