import {EventEmitter, Injectable, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerUrls} from '../server-urls';

@Injectable({
  providedIn: 'root'
})
export class ServerStateService {
  @Output() connectedToServer = new EventEmitter();
  @Output() disconnectedFromServer = new EventEmitter();

  private _isConnectedToServer = false;

  constructor(
    private http: HttpClient
  ) {
    this.pingServer(5000);
  }

  get isConnectedToServer() { return this._isConnectedToServer; }

  retry() {
    this.pingServer(-1);
  }

  private pingServer(interval) {
    this.http.get(ServerUrls.ping()).subscribe(
      res => {
        if (!this._isConnectedToServer) {
          this.connectedToServer.emit();
          this._isConnectedToServer = true;
        }
        if (interval > 0) {
          setTimeout(() => this.pingServer(interval), interval);
        }
      },
      err => {
        if (this._isConnectedToServer) {
          this.disconnectedFromServer.emit();
          this._isConnectedToServer = false;
        }
        if (interval > 0) {
          setTimeout(() => this.pingServer(interval), interval);
        }
      },
    );
  }

}
