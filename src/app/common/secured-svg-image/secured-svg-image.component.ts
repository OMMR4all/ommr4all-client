import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, map, startWith, switchMap} from 'rxjs/operators';
import {DomSanitizer} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: '[app-secured-svg-image]',                  // tslint:disable-line component-selector
  templateUrl: './secured-svg-image.component.html',
  styleUrls: ['./secured-svg-image.component.css']
})
export class SecuredSvgImageComponent implements OnChanges, OnInit, OnDestroy {
  private _subscriptions = new Subscription();
  @Input() private src: string;
  @Input() width = 0;
  @Input() height = 0;
  @Output() load = new EventEmitter();
  private src$ = new BehaviorSubject<string>(null);
  dataUrl$ = this.src$.pipe(
    filter(url => !!url),
    switchMap(url => this.loadImage(url)),
    startWith('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')
  );

  constructor(
    private httpClient: HttpClient,
    private domSanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this._subscriptions.add(this.dataUrl$.subscribe(
      url => this.load.emit(),
    ));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngOnChanges(): void {
    this.src$.next(this.src);
  }

  private loadImage(url: string): Observable<any> {
    return this.httpClient
      .get(url, {responseType: 'blob'}).pipe(
        map(e => URL.createObjectURL(e) )
      );
  }

}
