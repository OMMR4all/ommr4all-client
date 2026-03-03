import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {PageState} from '../../../editor.service';
import {filter, map} from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {ActionStatistics} from '../../../statistics/action-statistics';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../../utils/api-error';
import {ResizeObserverDirective} from '../../../../utils/directive/resize-observer.directive';

@Component({
    selector: 'app-render-view',
    templateUrl: './render-view.component.html',
    styleUrls: ['./render-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class RenderViewComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  private httpClient = inject(HttpClient);
  private changeDetector = inject(ChangeDetectorRef);

  public apiError: ApiError;
  private _subscriptions = new Subscription();
  @Output() finishedLoading = new EventEmitter<{finishedLoading: boolean, nodeList: NodeList}>();
  //@Input()
  //pageState: PageState;
  @Input()
  url: string;
  @ViewChild('dataContainer', {static: true}) dataContainer: ElementRef;

  private _currentPageState: PageState = null;
  public isLoading = true;
  contentWidth: number;

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    //if (this.pageState.pcgts !== null && this.pageState.pcgts !== undefined) {
           //if (this._currentPageState === null || (this.pageState.pcgts.page.imageFilename !== this._currentPageState.pcgts.page.imageFilename)) {
      //  this._currentPageState = this.pageState;
      //  if (this._currentPageState.zero !== true) {
          this.renderSVG();

      //}
   // }
  }

  ngAfterViewInit() {
  }

  renderSVG() {
    this.isLoading = true;

    this.contentWidth = this.dataContainer.nativeElement.offsetWidth;
    this.dataContainer.nativeElement.innerHTML = '';
    // change current state and load the preview of the next image
    //const url = this._currentPageState.pageCom.svg_url(this.contentWidth.toString());
    const headers = new HttpHeaders();
    headers.set('Accept', 'image/svg+xml');
    this.httpClient.get(this.url, {headers, responseType: 'text'}).subscribe(
      s => {
        this.isLoading = false;
        this.dataContainer.nativeElement.innerHTML = s;
        const nodes = (this.dataContainer.nativeElement.querySelectorAll('.note'));
        this.finishedLoading.emit({finishedLoading: true, nodeList: nodes});
        this.changeDetector.detectChanges();

      },
        error => {
        this.apiError = apiErrorFromHttpErrorResponse(error);

      });
  }

  onResize($event: any) {
    this.renderSVG();
  }
}
