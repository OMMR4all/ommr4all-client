import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BookCommunication, PageCommunication} from '../../data-types/communication';
import {BehaviorSubject, Subscription} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {UserComment, UserComments} from '../../data-types/page/userComment';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {filter} from 'rxjs/operators';
import {BookMeta} from '../../book-list.service';


@Component({
  selector: 'app-book-comments-view',
  templateUrl: './book-comments-view.component.html',
  styleUrls: ['./book-comments-view.component.css']
})
export class BookCommentsViewComponent implements OnInit, OnDestroy {
  private readonly subscriptions = new Subscription();
  book = new BehaviorSubject<BookCommunication>(undefined);
  private readonly _bookMeta = new BehaviorSubject<BookMeta>(new BookMeta());

  comments = new Array<{comments: UserComments, page: PageCommunication}>();
  get bookMeta() { return this._bookMeta.getValue(); }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {
    this.subscriptions.add(this.book.pipe(filter(b => !!b)).subscribe(book => {
      this.comments.length = 0;
      this.http.get<BookMeta>(book.meta()).subscribe(res => this._bookMeta.next(res));
      this.http.get<{data: Array<{comments: any, page: string}>}>(book.commentsUrl()).subscribe(
        r => this.comments.push(...r.data.map(d => {
          return {
            comments: UserComments.fromJson(d.comments, null),
            page: new PageCommunication(book, d.page),
          };
        }))
      ); }));
    this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this.book.next(new BookCommunication(params.get('book_id')));
      });
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
