import {EventEmitter, Injectable, Output} from '@angular/core';
import * as moment from 'moment';
import {HttpClient} from '@angular/common/http';
import {map, shareReplay} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  @Output() onLoggedIn = new EventEmitter();
  @Output() onLoggedOut = new EventEmitter();

  constructor(private http: HttpClient) {
  }

  login(username: string, password: string ) {
    return this.http.post<{token}>('/api/token-auth/', {username, password}).pipe(
      map(res => this.setSession(res)),
      shareReplay(),
    );
  }

  private setSession(authResult: {token}) {
    // const expiresAt = moment().add(authResult.expiresIn, 'second');

    localStorage.setItem('id_token', authResult.token);
    // localStorage.setItem('expires_at', JSON.stringify(expiresAt.valueOf()) );
    this.onLoggedIn.emit();
  }

  logout() {
    const wasLoggedIn = this.isLoggedIn();
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    if (wasLoggedIn) { this.onLoggedOut.emit(); }
  }

  public isLoggedIn() {
    return !!localStorage.getItem('id_token');
    // return moment().isBefore(this.getExpiration());
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }

  getExpiration() {
    const expiration = localStorage.getItem('expires_at');
    const expiresAt = JSON.parse(expiration);
    return moment(expiresAt);
  }
}
