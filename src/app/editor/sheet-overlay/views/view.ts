import {Observable, Subscription} from 'rxjs';
import {ChangeDetectorRef, Input, OnDestroy, OnInit} from '@angular/core';

export class View implements OnInit, OnDestroy {
  private _requestUpdateSubscription: Subscription;
  @Input() requestUpdate: Observable<void>;

  constructor(protected changeDetector: ChangeDetectorRef) {
    this.changeDetector.detach();
  }

  ngOnInit(): void {
    this._requestUpdateSubscription = this.requestUpdate.subscribe(() => this.changeDetector.markForCheck());
  }

  ngOnDestroy(): void {
    this._requestUpdateSubscription.unsubscribe();
  }
}
