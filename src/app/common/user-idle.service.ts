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
      const throttled = () => {
        const now = Date.now();
        if (now - lastReset > 1000) {
          this.reset();
          lastReset = now;
        }
      };

      // Discrete actions reset immediately; the ones that fire in bursts go through the
      // throttle. Scrolling and clicking count too -- reading a page for an hour without
      // touching the keyboard is not idle, but used to end the session as if it were.
      window.addEventListener('keydown', () => this.reset(), {passive: true});
      window.addEventListener('click', () => this.reset(), {passive: true});
      window.addEventListener('touchstart', () => this.reset(), {passive: true});

      window.addEventListener('mousemove', throttled, {passive: true});
      window.addEventListener('wheel', throttled, {passive: true});
      // capture: scrolling happens inside the editor's own containers and does not bubble
      window.addEventListener('scroll', throttled, {passive: true, capture: true});
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
