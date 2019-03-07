import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {BookCommunication, PageCommunication, PageResponse} from '../data-types/communication';
import {BehaviorSubject} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {ServerUrls} from '../server-urls';
import {AuthenticationService} from '../authentication/authentication.service';
import {HttpClient} from '@angular/common/http';
import {ServerStateService} from '../server-state/server-state.service';
import {BookMeta} from '../book-list.service';


@Component({
  selector: 'app-book-view',
  templateUrl: './book-view.component.html',
  styleUrls: ['./book-view.component.css']
})
export class BookViewComponent implements OnInit {
  errorMessage = '';
  private readonly _book = new BehaviorSubject<BookCommunication>(new BookCommunication(''));
  private readonly _bookMeta = new BehaviorSubject<BookMeta>(new BookMeta());
  get book() { return this._book; }
  get bookMeta() { return this._bookMeta; }
  readonly pages = new BehaviorSubject<PageCommunication[]>([]);


  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthenticationService,
    private serverState: ServerStateService,
  ) {
    this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this._book.next(new BookCommunication(params.get('book_id')));
      });
    this._book.asObservable().subscribe(book => {
      this.http.get<BookMeta>(book.meta()).subscribe(res => this._bookMeta.next(res));
      this.updatePages(book);
    });
    serverState.connectedToServer.subscribe(() => this.reload());
  }

  reload() {
    this.updatePages(this._book.getValue());
  }

  pagesDeleted(pages: PageCommunication[]) {
    const remaining = this.pages.getValue();
    pages.forEach(page => remaining.splice(remaining.indexOf(page), 1));
    this.pages.next(remaining);
  }

  pagesChanged(pages: PageCommunication[]) {
    this.updatePages(this.book.getValue());
  }

  bookMetaUpdated(bookMeta: BookMeta) {
    this._bookMeta.next(bookMeta);
  }

  private updatePages(book: BookCommunication) {
    if (!book || !book.book) {
      return;
    }
    if (!this.auth.isLoggedIn()) {
      this.errorMessage = 'No login';
      return;
    }
    this.errorMessage = '';
    this.http.get<{ pages: PageResponse[] }>(ServerUrls.listPages(book.book)).pipe(
      map(res => {
        return res.pages.map(page => new PageCommunication(book, page.label));
      })).subscribe(
      res => {
        this.pages.next(res);
      },
      err => {
        this.errorMessage = 'Error';
      }
    );
  }

  ngOnInit() {
    this.errorMessage = '';
  }
}
