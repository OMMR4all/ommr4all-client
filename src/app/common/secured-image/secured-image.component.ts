import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {filter, map, startWith, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-secured-image',
  templateUrl: './secured-image.component.html',
  styleUrls: ['./secured-image.component.css']
})
export class SecuredImageComponent implements OnChanges {
  @Input() private src = '';
  @Input() alt = '';
  @Output() load = new EventEmitter();
  private src$ = new BehaviorSubject(this.src);
  dataUrl$ = this.src$.pipe(
    switchMap(url => this.loadImage(url)),
    startWith('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')
  );

  constructor(
    private httpClient: HttpClient,
    private domSanitizer: DomSanitizer) {
  }

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
