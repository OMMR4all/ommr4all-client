import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookCommunication, DocumentCommunication, PageCommunication} from '../../data-types/communication';
import {BookMeta} from '../../book-list.service';
import {UserComments} from '../../data-types/page/userComment';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {filter} from 'rxjs/operators';
import {BookDocuments, Document} from '../../book-documents';
import {BookDocumentsService} from '../../book-documents.service';
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
import {TaskWorker} from "../../editor/task";
import {AlgorithmTypes} from "../book-step/algorithm-predictor-params";
import {downloadBase64} from "../../utils/local-download";
import {ExportDocumentsDialogComponent} from "./export-documents-dialog/export-documents-dialog.component";

const VIEW_STATE_STORAGE_KEY = 'ommr4all-book-documents-view-state';

interface StoredViewState {
  book: string;
  text: string;
  page: string;
  genre: string;
  festum: string;
}

@Component({
    selector: 'app-book-documents-view',
    templateUrl: './book-documents-view.component.html',
    styleUrls: ['./book-documents-view.component.scss'],
    standalone: false
})
export class BookDocumentsViewComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private modalDialog = inject(MatDialog);
  private documentsService = inject(BookDocumentsService);

  private readonly subscriptions = new Subscription();
  book = new BehaviorSubject<BookCommunication>(undefined);
  private readonly _bookMeta = new BehaviorSubject<BookMeta>(new BookMeta());
  private apiError: ApiError;
  @Output() switchPagination = new EventEmitter<PageEvent>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  private pageIndex = 0;
  private pageSize = 10;
  public documents: Document[] = null;
  // the cards are paginated by hand, so the filter produces the array the paginator slices
  public filteredDocuments: Document[] = [];
  filterText = '';
  filterPage = '';
  filterGenre = '';
  filterFestum = '';
  genres: string[] = [];
  festa: string[] = [];
  get bookMeta() {
    return this._bookMeta.getValue();
  }

  public docs: BookDocuments = undefined;
  downloadingAll = false;
  downloadingDocIds = new Set<string>();
  metaExportTask: TaskWorker = null;

  loadingDocumentsFailed = false;

  constructor() {
    this.subscriptions.add(this.book.pipe(filter(b => !!b)).subscribe(book => {
      this.loadingDocumentsFailed = false;
      this.restoreViewState();
      this.documentsService.select(book.book);
    }));
    this.subscriptions.add(this.documentsService.documentStateObs.pipe(filter(d => !!d)).subscribe(docs => {
      this.loadingDocumentsFailed = false;
      this.docs = docs;
      // the list is reloaded on every websocket change event, so re-apply the filter
      this.applyFilter();
      this.iterator();
    }));
    this.subscriptions.add(this.documentsService.errorObs.pipe(filter(e => !!e)).subscribe(error => {
      this.loadingDocumentsFailed = true;
      this.apiError = error;
    }));
    this.subscriptions.add(this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this.book.next(new BookCommunication(params.get('book_id')));
      }));
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
    this.documents = this.filteredDocuments.slice(start, end);
  }

  get totalDocuments(): number {
    return this.docs ? this.docs.database_documents.documents.length : 0;
  }

  get filterActive(): boolean {
    return !!(this.filterText || this.filterPage || this.filterGenre || this.filterFestum);
  }

  updateFilter() {
    this.applyFilter();
    // a filtered list is shorter, so the current page may no longer exist
    this.pageIndex = 0;
    if (this.paginator) { this.paginator.firstPage(); }
    this.iterator();
    this.storeViewState();
  }

  private applyFilter() {
    const all = this.docs ? this.docs.database_documents.documents : [];
    this.genres = this.distinctOf(all, doc => doc.document_meta_infos.genre);
    this.festa = this.distinctOf(all, doc => doc.document_meta_infos.festum);
    const text = this.filterText.trim().toLowerCase();
    const page = this.filterPage.trim().toLowerCase();
    this.filteredDocuments = all.filter(doc => {
      if (text && !(this.getInitium(doc).toLowerCase().includes(text)
        || doc.textinitium.toLowerCase().includes(text)
        || doc.doc_id.toLowerCase().includes(text))) {
        return false;
      }
      if (page && !doc.start_point.page_name.toLowerCase().includes(page)) { return false; }
      if (this.filterGenre && doc.document_meta_infos.genre !== this.filterGenre) { return false; }
      if (this.filterFestum && doc.document_meta_infos.festum !== this.filterFestum) { return false; }
      return true;
    });
  }

  private distinctOf(documents: Document[], of: (doc: Document) => string): string[] {
    const values = new Set<string>();
    documents.forEach(doc => { const v = of(doc); if (v) { values.add(v); } });
    return Array.from(values).sort();
  }

  private restoreViewState() {
    try {
      const stored = JSON.parse(localStorage.getItem(VIEW_STATE_STORAGE_KEY)) as StoredViewState;
      if (!stored || stored.book !== this.book.getValue().book) { return; }
      this.filterText = stored.text || '';
      this.filterPage = stored.page || '';
      this.filterGenre = stored.genre || '';
      this.filterFestum = stored.festum || '';
    } catch (e) {
      // ignore corrupt stored state
    }
  }

  private storeViewState() {
    try {
      localStorage.setItem(VIEW_STATE_STORAGE_KEY, JSON.stringify({
        book: this.book.getValue().book,
        text: this.filterText,
        page: this.filterPage,
        genre: this.filterGenre,
        festum: this.filterFestum,
      } as StoredViewState));
    } catch (e) {
      // storage full or unavailable
    }
  }
  getDocumentCommunication(document) {
    return new DocumentCommunication(this.book.getValue(), document);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // no deselect() here: this component is destroyed on every book-view tab switch, and
    // dropping the root singleton's cache would re-run GET /documents and re-open the
    // websocket on every return. BookViewComponent owns the selection lifetime.
    if (this.metaExportTask) { this.metaExportTask.stopStatusPoller(); }
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

  onDownload(b: Document) {
    // the document's own export, not the export of its pages: the pages of a chant almost
    // always carry lines of the neighbouring chants too
    this.modalDialog.open(ExportDocumentsDialogComponent, {
      maxWidth: '500px',
      data: {
        book: this.book.getValue(),
        document: b,
      }
    });
  }

  onDownloadMetaFile(b: Document) {
    this.downloadingDocIds.add(b.doc_id);
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
        this.downloadingDocIds.delete(b.doc_id);
      },
      errors => {
        this.apiError = apiErrorFromHttpErrorResponse(errors);
        this.downloadingDocIds.delete(b.doc_id);
      }
    );
  }

  onDownloadMetaFileAll() {
    if (this.downloadingAll) { return; }
    this.downloadingAll = true;
    const bookcom = this.book.getValue();
    this.metaExportTask = new TaskWorker(AlgorithmTypes.DocumentsExport, this.http, bookcom, {format: 'monodi_meta.xlsx'});
    this.metaExportTask.taskFinished.subscribe((res: {filename: string, mime: string, data: string}) => {
      this.downloadingAll = false;
      if (res && res.data) {
        downloadBase64(res.data, res.mime, 'MonodiMetaFile.xlsx');
      } else {
        this.apiError = this.metaExportTask.apiError;
      }
    });
    this.metaExportTask.putTask();
  }

  onDownloadAllDocuments() {
    this.modalDialog.open(ExportDocumentsDialogComponent, {
      maxWidth: '500px',
      data: {
        book: this.book.getValue(),
      }
    });
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

