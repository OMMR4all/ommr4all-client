import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerStateService} from './server-state/server-state.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookDocuments} from './book-documents';
import {BookCommunication, PageCommunication} from './data-types/communication';
import {EditorService} from "./editor/editor.service";


@Injectable({
  providedIn: 'root'
})
export class BookDocumentsService {
  private _subscriptions = new Subscription();
  // tslint:disable-next-line:variable-name
  private _document_state = new BehaviorSubject<BookDocuments>(null);
  private _lastBookCommunication: BookCommunication = null;

  private _lastPageCommunication: PageCommunication = null;
  constructor(private http: HttpClient,
              private serverState: ServerStateService,
              private editorState: EditorService) {
    this._subscriptions.add(serverState.connectedToServer.subscribe(() => {
      this.load();
    }));
  }

  load() {
    if (this._lastBookCommunication) {
      this.http.get(this._lastBookCommunication.documentsUrl()).subscribe(r => {
        this._document_state.next(BookDocuments.fromJson(r));
      });
    }
  }
  updateState() {
    this.load();
  }
  updatePageState() {
    this.http.get(this.editorState.pageStateVal.pageCom.document_page_update_url()
    ).subscribe(r => {
      this._document_state.next(BookDocuments.fromJson(r));
    });
  }
  select(book: string) {
    if (this._lastBookCommunication == null || book !== this._lastBookCommunication.book) {
      this._lastBookCommunication = new BookCommunication(book);
      this.load();
    }
  }
  get documentStateObs() { return this._document_state.asObservable(); }
  get documentStateVal() { return this._document_state.getValue(); }
}
