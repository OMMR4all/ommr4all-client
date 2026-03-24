import {EventEmitter, HostListener, inject, Injectable, NgZone} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserIdleService {
  private _idleTime = 0;
  private readonly _timeout = 60;
  public timeout = new BehaviorSubject<boolean>(false);
  public get isTimedOut() { return this._idleTime >= this._timeout; }
  private ngZone = inject(NgZone);
  constructor() {
    setInterval(() => {
      this.timerIncrement();
    }, 60000);  // 1 minute
    this.ngZone.runOutsideAngular(() => {
      let lastReset = 0;

      window.addEventListener('keydown', () => {
        this.reset();
      }, {passive: true});

      window.addEventListener('mousemove', () => {
        const now = Date.now();
        if (now - lastReset > 1000) {
          this.reset();
          lastReset = now;
        }
      }, {passive: true});
    });
  }
  private reset() {
    this._idleTime = 0;
    if (this.timeout.getValue() === true) {
      this.ngZone.run(() => this.timeout.next(false));
    }
  }
  private timerIncrement() {
    if (this._idleTime < this._timeout && this._idleTime + 1 >= this._timeout) {
      this.timeout.next(true);
    }
    this._idleTime += 1;
  }
}
