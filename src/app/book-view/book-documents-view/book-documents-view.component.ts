import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookCommunication, PageCommunication} from '../../data-types/communication';
import {BookMeta} from '../../book-list.service';
import {UserComments} from '../../data-types/page/userComment';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {filter} from 'rxjs/operators';
import {BookDocuments, Document} from '../../book-documents';
import {ExportPagesDialogComponent} from '../books-preview/export-pages-dialog/export-pages-dialog.component';
import {arrayFromSet} from '../../utils/copy';
import {MatDialog} from '@angular/material';

@Component({
  selector: 'app-book-documents-view',
  templateUrl: './book-documents-view.component.html',
  styleUrls: ['./book-documents-view.component.scss']
})
export class BookDocumentsViewComponent implements OnInit, OnDestroy {

  private readonly subscriptions = new Subscription();
  book = new BehaviorSubject<BookCommunication>(undefined);
  private readonly _bookMeta = new BehaviorSubject<BookMeta>(new BookMeta());

  comments = new Array<{ comments: UserComments, page: PageCommunication }>();

  get bookMeta() {
    return this._bookMeta.getValue();
  }

  public docs: BookDocuments = undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private modalDialog: MatDialog,

  ) {
    this.subscriptions.add(this.book.pipe(filter(b => !!b)).subscribe(book => {
      this.comments.length = 0;
      this.http.get(book.documentsUrl()).subscribe(r => {
        this.docs = BookDocuments.fromJson(r);
      });
    }));
    this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this.book.next(new BookCommunication(params.get('book_id')));
      });
  }

  ngOnInit() {
  }

  getPageCommunication(page) {
    return new PageCommunication(this.book.getValue(), page);
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  routeToDocumentSVGView(b: Document) {
    this.router.navigate(['book', this.book.getValue().book, 'document', b.doc_id, 'view' ]);

  }
  onDownload(pages: Array<PageCommunication>) {
    this.modalDialog.open(ExportPagesDialogComponent, {
      data: {
        book: this.book.getValue(),
        bookMeta: this.bookMeta,
        pages,
      }
    });
  }
}
