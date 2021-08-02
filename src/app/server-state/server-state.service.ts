import { EventEmitter, Injectable, Output, Directive } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerUrls} from '../server-urls';
import {ActivatedRoute} from '@angular/router';

@Directive()
@Injectable({
  providedIn: 'root'
})
export class ServerStateService {
  private _timeoutHandle: any = null;
  @Output() connectedToServer = new EventEmitter();
  @Output() disconnectedFromServer = new EventEmitter();

  private _isConnectedToServer = true;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
  ) {
    this.route.url.subscribe(() => this.start());
  }

  get isConnectedToServer() { return this._isConnectedToServer; }

  start() {
    if (this._timeoutHandle) {
      clearInterval(this._timeoutHandle);
    }
    this.pingServer();
    this._timeoutHandle = setInterval(() => this.pingServer(), 5000);
  }

  retry() {
    this.start();
  }

  private pingServer() {
    return;
    this.http.get(ServerUrls.ping()).subscribe(
      res => {
        if (!this._isConnectedToServer) {
          this.connectedToServer.emit();
          this._isConnectedToServer = true;
        }
      },
      err => {
        if (this._isConnectedToServer) {
          this.disconnectedFromServer.emit();
          this._isConnectedToServer = false;
        }
      },
    );
  }

}
