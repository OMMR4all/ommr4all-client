import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {PageState} from '../../../editor.service';
import {filter, map} from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ActionStatistics} from '../../../statistics/action-statistics';
import {apiErrorFromHttpErrorResponse} from '../../../../utils/api-error';

@Component({
  selector: 'app-render-view',
  templateUrl: './render-view.component.html',
  styleUrls: ['./render-view.component.scss']
})
export class RenderViewComponent implements OnInit, OnDestroy {

  private _subscriptions = new Subscription();
  @Input()
  pageState: Observable<PageState>;
  @ViewChild('dataContainer', {static: true}) dataContainer: ElementRef;

  private _currentPageState: PageState = null;

  image = new BehaviorSubject<string>(null);
  url = this.image.pipe(
    filter(v => !!v),
    map(v => this._currentPageState.pageCom.image_url('color', v))
  );

  constructor(    private httpClient: HttpClient,
  ) { }

  ngOnInit() {
    this._subscriptions.add(this.pageState.subscribe(ps => {
      // change current state and load the preview of the next image
      this._currentPageState = ps;
      const url = this._currentPageState.pageCom.content_url('monodiplus_svg');
      const headers = new HttpHeaders();
      headers.set('Accept', 'image/svg+xml');
      this.httpClient.get(url, {headers, responseType: 'text'}).subscribe(
        s => {this.dataContainer.nativeElement.innerHTML = s; }
        , error => {console.log('Todo Api Error');}); }));


  }


  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

}
