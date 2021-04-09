import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {PageState} from '../../../editor.service';
import {filter, map} from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ActionStatistics} from '../../../statistics/action-statistics';
import {apiErrorFromHttpErrorResponse} from '../../../../utils/api-error';
import {ResizeObserverDirective} from '../../../../utils/directive/resize-observer.directive';

@Component({
  selector: 'app-render-view',
  templateUrl: './render-view.component.html',
  styleUrls: ['./render-view.component.scss']
})
export class RenderViewComponent implements OnInit, OnDestroy, AfterViewInit {

  private _subscriptions = new Subscription();
  @Input()
  pageState: Observable<PageState>;
  @Input() events: Observable<void>;
  @ViewChild('dataContainer', {static: true}) dataContainer: ElementRef;

  private _currentPageState: PageState = null;
  contentWidth: number;
  rendered: boolean;
  constructor(    private httpClient: HttpClient,
  ) { }

  ngOnInit() {

  }
  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }
  ngAfterViewInit() {
    this._subscriptions.add(this.pageState.subscribe(ps => {
        // change current state and load the preview of the next image
      this._currentPageState = ps;
      this.renderSVG();
 }
    ));
    // this._subscriptions.add(this.events.subscribe(() => this.renderSVG()));
  }
  renderSVG() {
      this.contentWidth = this.dataContainer.nativeElement.offsetWidth;
      this.dataContainer.nativeElement.innerHTML = '';
      console.log(this.contentWidth);

      // change current state and load the preview of the next image
      const url = this._currentPageState.pageCom.svg_url(this.contentWidth.toString());
      const headers = new HttpHeaders();
      headers.set('Accept', 'image/svg+xml');
      this.httpClient.get(url, {headers, responseType: 'text'}).subscribe(
        s => {
          this.rendered = true;
          this.dataContainer.nativeElement.innerHTML = s;
        }
        , error => {
          console.log('Todo Api Error');
          console.log(error);
        });
  }
  onResize($event: any) {
    this.renderSVG(); }
}
