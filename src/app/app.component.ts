import { Component } from '@angular/core';
import {BookListService} from './book-list.service';
import {Router} from '@angular/router';
import {ServerStateService} from './server-state/server-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    public books: BookListService,
    public router: Router,
    public serverState: ServerStateService,
  ) {
  }

  get displayHeader() { return !this.router.url.endsWith('/edit'); }
}
