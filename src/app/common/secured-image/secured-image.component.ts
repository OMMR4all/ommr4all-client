import {Component, EventEmitter, Input, OnChanges, OnInit, Output, inject, SimpleChanges} from '@angular/core';
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
export class SecuredImageComponent implements OnChanges {
  private httpClient = inject(HttpClient);
  private domSanitizer = inject(DomSanitizer);

  @Input() src = '';
  @Input() alt = '';
  @Output() load = new EventEmitter();
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

  private loadImage(url: string): Observable<any> {
    return this.httpClient
      .get(url, {responseType: 'blob'}).pipe(
        map(e => this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(e)) )
      );

  }

}
