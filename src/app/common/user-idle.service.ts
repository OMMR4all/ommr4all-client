import {EventEmitter, HostListener, Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserIdleService {
  private _idleTime = 0;
  private readonly _timeout = 60;
  public timeout = new BehaviorSubject<boolean>(false);
  public get isTimedOut() { return this._idleTime >= this._timeout; }

  constructor() {
    setInterval(() => { this.timerIncrement(); }, 60000);  // 1 minute

    // HostListener not working in Service
    window.addEventListener('keydown', (event) => {
      this.reset();
    }, {passive: true});
    window.addEventListener('mousemove', (event) => {
      this.reset();
    }, {passive: true});
  }

  private reset() {
    this._idleTime = 0;
    this.timeout.next(false);
  }

  private timerIncrement() {
    if (this._idleTime < this._timeout && this._idleTime + 1 >= this._timeout) {
      this.timeout.next(true);
    }
    this._idleTime += 1;
  }
}
