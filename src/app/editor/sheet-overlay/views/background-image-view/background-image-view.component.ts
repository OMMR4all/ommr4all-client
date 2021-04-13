import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {PageState} from '../../../editor.service';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, map} from 'rxjs/operators';

@Component({
  selector: '[app-background-image-view]',  // tslint:disable-line component-selector
  templateUrl: './background-image-view.component.html',
  styleUrls: ['./background-image-view.component.css']
})
export class BackgroundImageViewComponent implements OnInit, OnDestroy {
  private _subscriptions = new Subscription();
  @Input()
  pageState: Observable<PageState>;
  @Input()
  showOutlineOnly = false;
  @Output()
  loadPercentage = new EventEmitter<number>();

  // first load low res (even preview), afterwards with ongoing higher resolution if the previous image is loaded
  private readonly _imagesToShow = ['lowres_preproc_preview', 'lowres_preproc', 'highres_preproc'];

  private _currentPageState: PageState = null;

  image = new BehaviorSubject<string>(null);
  url = this.image.pipe(
    filter(v => !!v),
    map(v => this._currentPageState.pageCom.image_url('color', v))
  );

  constructor() { }

  ngOnInit() {
    this._subscriptions.add(this.pageState.subscribe(ps => {
      console.log("image");
      // change current state and load the preview of the next image
      this._currentPageState = ps;
      this.loadPercentage.emit(0);
      this.image.next(this._imagesToShow[0]);
    }));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  imageLoaded() {
    // load the next image
    let idx = this._imagesToShow.indexOf(this.image.getValue());
    if (idx === undefined) { idx = 0; } else { idx += 1; }
    this.loadPercentage.emit(idx / this._imagesToShow.length);
    if (idx < this._imagesToShow.length) {
      this.image.next(this._imagesToShow[idx]);
    }
  }
}
