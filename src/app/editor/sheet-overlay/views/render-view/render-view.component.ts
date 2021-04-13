import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input, OnChanges,
  OnDestroy,
  OnInit,
  Output, SimpleChanges,
  ViewChild
} from '@angular/core';
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
  styleUrls: ['./render-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class RenderViewComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  private _subscriptions = new Subscription();
  @Input()
  pageState: PageState;
  @ViewChild('dataContainer', {static: true}) dataContainer: ElementRef;

  private _currentPageState: PageState = null;
  contentWidth: number;
  rendered: boolean;

  constructor(private httpClient: HttpClient,
  ) {
  }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.pageState.pcgts !== null && this.pageState.pcgts !== undefined) {
      // tslint:disable-next-line:max-line-length
      if (this._currentPageState === null || (this.pageState.pcgts.page.imageFilename !== this._currentPageState.pcgts.page.imageFilename)) {
        this._currentPageState = this.pageState;
        if (this._currentPageState.zero !== true) {
          this.renderSVG();

        }

      }
    }
  }

  ngAfterViewInit() {


    // this._subscriptions.add(this.events.subscribe(() => this.renderSVG()));
  }

  renderSVG() {
    this.contentWidth = this.dataContainer.nativeElement.offsetWidth;
    this.dataContainer.nativeElement.innerHTML = '';
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
    this.renderSVG();
  }
}
