import { Component } from '@angular/core';
import {BookListService} from './book-list.service';
import {Router} from '@angular/router';
import {ServerStateService} from './server-state/server-state.service';
import {AuthenticationService} from './authentication/authentication.service';
import {UserIdleService} from './common/user-idle.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    public books: BookListService,
    public router: Router,
    public auth: AuthenticationService,
    private userIdle: UserIdleService,
  ) {
    userIdle.timeout.asObservable().subscribe((to) => { if (to) { this.auth.logout(); }});
  }

  get displayHeader() { return !this.router.url.endsWith('/edit'); }
}
