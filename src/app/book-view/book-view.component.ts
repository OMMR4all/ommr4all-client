import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {BookCommunication, PageCommunication, PageResponse} from '../data-types/communication';
import {BehaviorSubject} from 'rxjs';
import {filter, map, switchMap} from 'rxjs/operators';
import {ServerUrls} from '../server-urls';
import {AuthenticationService} from '../authentication/authentication.service';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ServerStateService} from '../server-state/server-state.service';
import {BookMeta} from '../book-list.service';
import {PageEvent} from '@angular/material';
import {BookPermissionFlag, BookPermissionFlags} from '../data-types/permissions';


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
  readonly view = new BehaviorSubject<string>('');

  commentsCount = new BehaviorSubject<number>(0);

  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;


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
        this.view.next(params.get('view'));
      });
    this._book.asObservable().subscribe(book => {
      this.http.get<BookMeta>(book.meta()).subscribe(res => this._bookMeta.next(new BookMeta().copyFrom(res)));
      this.updatePages(book);
    });
    serverState.connectedToServer.subscribe(() => this.reload());
  }

  get loaded() { return this.book.getValue().book.length > 0 && this.bookMeta.getValue().id.length > 0; }
  link(page: string) { return '/book/' + this.book.getValue().book + '/view/' + page; }
  showAuth() { return (new BookPermissionFlags(this.bookMeta.getValue().permissions)).has(BookPermissionFlag.EditPermissions); }
  showTrain() { return (new BookPermissionFlags(this.bookMeta.getValue().permissions)).has(BookPermissionFlag.ReadWrite); }
  showSettings() { return (new BookPermissionFlags(this.bookMeta.getValue().permissions)).has(BookPermissionFlag.EditBookMeta); }

  reload() {
    this.updatePages(this._book.getValue());
  }

  pagesDeleted(pages: PageCommunication[]) {
    const remaining = this.pages.getValue();
    pages.filter(page => remaining.indexOf(page) >= 0).forEach(page => remaining.splice(remaining.indexOf(page), 1));
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
    const params = new HttpParams().append('pageIndex', this.pageIndex.toString()).append('pageSize', this.pageSize.toString());
    this.http.get<{ pages: PageResponse[], totalPages: number }>(ServerUrls.listPages(book.book), {params: params}).pipe(
      map(res => {
        this.totalPages = res.totalPages;
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

  switchPagination(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.updatePages(this.book.getValue());
  }

  ngOnInit() {
    this.errorMessage = '';
    this.book.pipe(filter(com => !!com))
      .subscribe(com => this.http.get<{count: number}>(com.commentsCountUrl()).subscribe(v => this.commentsCount.next(v.count)));
  }
}
