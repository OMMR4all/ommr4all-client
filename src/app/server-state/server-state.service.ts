import {EventEmitter, Injectable, Output, Directive, inject, NgZone} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {ServerUrls} from '../server-urls';
import {ActivatedRoute} from '@angular/router';

@Directive()
@Injectable({
  providedIn: 'root'
})
export class ServerStateService {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  private _timeoutHandle: any = null;
  @Output() connectedToServer = new EventEmitter();
  @Output() disconnectedFromServer = new EventEmitter();

  private _isConnectedToServer = true;

  constructor() {
    this.route.url.subscribe(() => this.start());
  }

  get isConnectedToServer() { return this._isConnectedToServer; }

  start() {
    if (this._timeoutHandle) {
      clearInterval(this._timeoutHandle);
    }
    this.pingServer();
    this.ngZone.runOutsideAngular(() => {
      this._timeoutHandle = setInterval(() => this.pingServer(), 5000);
    });
  }

  retry() {
    this.start();
  }

  private pingServer() {
    this.http.get(ServerUrls.ping()).subscribe({
      next: (res) => {
        if (!this._isConnectedToServer) {
          this.ngZone.run(() => {
            this._isConnectedToServer = true;
            this.connectedToServer.emit();
          });
        }
      },
      error: (err) => {
        if (this._isConnectedToServer) {
          this.ngZone.run(() => {
            this._isConnectedToServer = false;
            this.disconnectedFromServer.emit();
          });
        }
      }
    });
  }

}
