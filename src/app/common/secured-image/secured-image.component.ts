import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {filter, map, startWith, switchMap} from 'rxjs/operators';

@Component({
    selector: 'app-secured-image',
    templateUrl: './secured-image.component.html',
    styleUrls: ['./secured-image.component.css'],
    standalone: false
})
export class SecuredImageComponent implements OnChanges {
  private httpClient = inject(HttpClient);
  private domSanitizer = inject(DomSanitizer);

  @Input() private src = '';
  @Input() alt = '';
  @Output() load = new EventEmitter();
  private src$ = new BehaviorSubject(this.src);
  dataUrl$ = this.src$.pipe(
    switchMap(url => this.loadImage(url)),
    startWith('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')
  );

  ngOnChanges(): void {
    this.src$.next(this.src);
  }

  private loadImage(url: string): Observable<any> {
    return this.httpClient
      .get(url, {responseType: 'blob'}).pipe(
        map(e => this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(e)) )
      );
  }

}
