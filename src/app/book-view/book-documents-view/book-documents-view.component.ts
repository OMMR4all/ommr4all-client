import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookCommunication, DocumentCommunication, PageCommunication} from '../../data-types/communication';
import {BookMeta} from '../../book-list.service';
import {UserComments} from '../../data-types/page/userComment';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {filter} from 'rxjs/operators';
import {BookDocuments, Document} from '../../book-documents';
import {ExportPagesDialogComponent} from '../books-preview/export-pages-dialog/export-pages-dialog.component';
import {arrayFromSet} from '../../utils/copy';
import { MatDialog } from '@angular/material/dialog';
import {WorkflowFinishDialogComponent} from '../../editor/dialogs/workflow-finish-dialog/workflow-finish-dialog.component';
import {MonodiLoginDialogComponent} from './monodi-login-dialog/monodi-login-dialog.component';
import {MonodiStatusDialogComponent, StatusInfo} from './monodi-status-dialog/monodi-status-dialog.component';
import {ApiError, apiErrorFromHttpErrorResponse, ErrorCodes} from '../../utils/api-error';
import {
  LyricsPasteToolDialogComponent
} from "../../editor/dialogs/lyrics-paste-tool-dialog/lyrics-paste-tool-dialog.component";
import {EditorTools} from "../../editor/tool-bar/tool-bar-state.service";
import {AlgorithmGroups} from "../book-step/algorithm-predictor-params";
import {
  DocumentAlignmentDialogComponent
} from "../../editor/dialogs/document-alignment-dialog/document-alignment-dialog.component";
import {PageEvent} from "@angular/material/paginator";

@Component({
  selector: 'app-book-documents-view',
  templateUrl: './book-documents-view.component.html',
  styleUrls: ['./book-documents-view.component.scss']
})
export class BookDocumentsViewComponent implements OnInit, OnDestroy {
  private readonly subscriptions = new Subscription();
  book = new BehaviorSubject<BookCommunication>(undefined);
  private readonly _bookMeta = new BehaviorSubject<BookMeta>(new BookMeta());
  private apiError: ApiError;
  @Output() switchPagination = new EventEmitter<PageEvent>();
  private pageIndex = 0;
  private pageSize = 10;
  public documents: Array<Document> = null;
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
      this.http.get(book.documentsUrl()).subscribe(r => {
        this.docs = BookDocuments.fromJson(r);
        this.iterator();
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
  paginatorChanged(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.iterator();
  }
  private iterator() {
    const end = (this.pageIndex + 1) * this.pageSize;
    const start = this.pageIndex * this.pageSize;
    this.documents = this.docs.database_documents.documents.slice(start, end);

  }
  getDocumentCommunication(document) {
    return new DocumentCommunication(this.book.getValue(), document);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  getInitium(doc: Document): string {
    const initium = doc.document_meta_infos.initium;
    if (initium.length > 0) {
      return initium;
    }
    return doc.textinitium;
  }
  routeToDocumentSVGView(b: Document) {
    this.router.navigate(['book', this.book.getValue().book, 'document', b.doc_id, 'view']);

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

  onDownloadMetaFile(b: Document) {
    const headers = new HttpHeaders();
    headers.set('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const com = this.getDocumentCommunication(b.doc_id);
    this.http.get(com.document_config_ods_url(), {headers, responseType: 'blob' as 'json'}).subscribe(
      (result: any) => {
        // Handle result
        const blob = new Blob([result], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        const downloadURL = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = 'MonodiMetaFile.xlsx';
        link.click();
      },
      errors => {
        this.apiError = apiErrorFromHttpErrorResponse(errors);
      },
      () => {
        // 'onCompleted' callback.
        // No errors, route to new page here
      }
    );

  }

  onDownloadMetaFileAll() {
    const headers = new HttpHeaders();
    headers.set('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const bookcom = this.book.getValue();
    this.http.get(bookcom.documentsOdsUrl(), {headers, responseType: 'blob' as 'json'}).subscribe(
      (result: any) => {
        // Handle result
        const blob = new Blob([result], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        const downloadURL = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = 'MonodiMetaFile.xlsx';
        link.click();
      },
      errors => {
        this.apiError = apiErrorFromHttpErrorResponse(errors);
      },
      () => {
        // 'onCompleted' callback.
        // No errors, route to new page here
      }
    );
  }

  onSendToMonodi(documents: Document[]) {
    const bookcom = this.book.getValue();
    const body = documents.map((next) => next.toJson());
    this.http.put(bookcom.monodiUrl(), body).subscribe(
      (next) => {
        const dialogRef = this.modalDialog.open(MonodiStatusDialogComponent, {
          maxWidth: '500px',
          data: new StatusInfo('Monodi Info', 'Document data successfully send to Monodi')
        });
      },
      errors => {
        this.apiError = apiErrorFromHttpErrorResponse(errors);
        if (this.apiError.errorCode === ErrorCodes.MonodiLoginRequired) {
          const dialogRef = this.modalDialog.open(MonodiLoginDialogComponent, {
            maxWidth: '500px',
          });
        }
      }
    );
  }

  updateDocument(documents: Document[]) {
    const bookcom = this.book.getValue();
    this.modalDialog.open(DocumentAlignmentDialogComponent, {
      disableClose: false,
      width: '600px',
      data: {
        document: documents[0],
        bookCom:  this.book.getValue(),
      }
    }).afterClosed().subscribe((r) => {
      }
    );
    // const body = documents.map((next) => next.toJson());
  }
}

