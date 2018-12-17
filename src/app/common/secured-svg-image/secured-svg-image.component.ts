import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map, startWith, switchMap} from 'rxjs/operators';
import {DomSanitizer} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: '[app-secured-svg-image]',                  // tslint:disable-line component-selector
  templateUrl: './secured-svg-image.component.html',
  styleUrls: ['./secured-svg-image.component.css']
})
export class SecuredSvgImageComponent implements OnChanges {
  @Input() private src: string;
  @Input() width = 0;
  @Input() height = 0;
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
        map(e => URL.createObjectURL(e) )
      );
  }

}
