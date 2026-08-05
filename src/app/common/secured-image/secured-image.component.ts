import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, inject, SimpleChanges} from '@angular/core';
import {BehaviorSubject, Observable, of, tap} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {catchError, filter, map, startWith, switchMap} from 'rxjs/operators';

@Component({
    selector: 'app-secured-image',
    templateUrl: './secured-image.component.html',
    styleUrls: ['./secured-image.component.css'],
    standalone: false
})
export class SecuredImageComponent implements OnChanges, OnDestroy {
  private httpClient = inject(HttpClient);
  private domSanitizer = inject(DomSanitizer);

  // the blob behind an object URL stays alive until it is revoked; the page/document
  // lists re-create dozens of these on every book-view tab switch
  private objectUrl: string = null;

  @Input() src = '';
  @Input() alt = '';
  @Output() load = new EventEmitter();
  @Output() error = new EventEmitter();
  private src$ = new BehaviorSubject(this.src);
  dataUrl$ = this.src$.pipe(
    filter(url => !!url && url.length > 0),
    switchMap(url => this.loadImage(url)),
    startWith('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (this.src) {
      this.src$.next(this.src);
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  private loadImage(url: string): Observable<any> {
    return this.httpClient
      .get(url, {responseType: 'blob'}).pipe(
        map(e => {
          this.revokeObjectUrl();
          this.objectUrl = URL.createObjectURL(e);
          return this.domSanitizer.bypassSecurityTrustUrl(this.objectUrl);
        })
      );

  }

  private revokeObjectUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

}
