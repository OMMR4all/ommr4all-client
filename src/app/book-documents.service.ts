import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {ServerStateService} from './server-state/server-state.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookDocuments} from './book-documents';
import {BookCommunication} from './data-types/communication';
import {ServerUrls} from './server-urls';
import {AuthenticatedUser} from './authentication/user';
import {ApiError, apiErrorFromHttpErrorResponse} from './utils/api-error';


@Injectable({
  providedIn: 'root'
})
export class BookDocumentsService {
  private http = inject(HttpClient);
  private serverState = inject(ServerStateService);

  private _subscriptions = new Subscription();
  private _document_state = new BehaviorSubject<BookDocuments>(null);
  private _error = new BehaviorSubject<ApiError>(null);
  private _lastBookCommunication: BookCommunication = null;

  private _socket: WebSocket = null;
  private _reconnectDelayMs = 1_000;
  private _reconnectTimer = null;

  constructor() {
    const serverState = this.serverState;

    this._subscriptions.add(serverState.connectedToServer.subscribe(() => {
      this.load();
    }));
  }

  select(book: string) {
    if (this._lastBookCommunication == null || book !== this._lastBookCommunication.book) {
      this._lastBookCommunication = new BookCommunication(book);
      this._document_state.next(null);
      this.load();
      this.connect();
    }
  }

  deselect() {
    this._lastBookCommunication = null;
    this._document_state.next(null);
    this._error.next(null);
    this.closeSocket();
  }

  load() {
    if (this._lastBookCommunication) {
      this.http.get(this._lastBookCommunication.documentsUrl()).subscribe(r => {
        this._error.next(null);
        this._document_state.next(BookDocuments.fromJson(r));
      }, errors => {
        this._error.next(apiErrorFromHttpErrorResponse(errors));
      });
    }
  }
  updateState() {
    this.load();
  }

  get documentStateObs() { return this._document_state.asObservable(); }
  get documentStateVal() { return this._document_state.getValue(); }
  get errorObs() { return this._error.asObservable(); }

  // Live updates: the server broadcasts a documents_changed event whenever any user's
  // page save alters the chant structure of the book; we then simply re-fetch.
  // Everything works without the socket, just without the automatic refresh.
  private connect() {
    this.closeSocket();
    if (!this._lastBookCommunication || typeof WebSocket === 'undefined') { return; }
    const book = this._lastBookCommunication.book;
    let url = ServerUrls.bookDocumentsSocket(book);
    const user = JSON.parse(localStorage.getItem('user')) as AuthenticatedUser;
    if (user && user.access) {
      // browsers cannot send an Authorization header on websocket connects
      url += '?token=' + encodeURIComponent(user.access);
    }
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (e) {
      return;  // live updates unavailable
    }
    this._socket = socket;
    socket.onopen = () => { this._reconnectDelayMs = 1_000; };
    socket.onmessage = message => {
      try {
        const data = JSON.parse(message.data);
        if (data.event === 'documents_changed') { this.load(); }
      } catch (e) {
      }
    };
    socket.onclose = event => {
      // 4403: server rejected due to missing permissions -- retrying won't help
      if (this._socket !== socket || event.code === 4403) { return; }
      this._socket = null;
      this._reconnectTimer = setTimeout(() => this.connect(), this._reconnectDelayMs);
      this._reconnectDelayMs = Math.min(this._reconnectDelayMs * 2, 30_000);
    };
  }

  private closeSocket() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    if (this._socket) {
      const socket = this._socket;
      this._socket = null;
      socket.close();
    }
  }
}
