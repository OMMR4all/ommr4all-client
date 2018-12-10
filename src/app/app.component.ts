import { Component } from '@angular/core';
import {BookListService} from './book-list.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    public books: BookListService,
  ) {
  }
}
