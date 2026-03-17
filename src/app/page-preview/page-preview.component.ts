import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import {PageCommunication} from '../data-types/communication';
import { HttpClient } from '@angular/common/http';
import {PageEditingProgress, PageProgressGroups} from '../data-types/page-editing-progress';
import {Subscription} from "rxjs";

@Component({
    selector: 'app-page-preview',
    templateUrl: './page-preview.component.html',
    styleUrls: ['./page-preview.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PagePreviewComponent implements OnInit, AfterViewInit, OnDestroy {
   private http = inject(HttpClient);
   private changeDetector = inject(ChangeDetectorRef);
   private elementRef = inject(ElementRef);
   private progressSub: Subscription;
   readonly Locked = PageProgressGroups;
  @Output() view = new EventEmitter();
  @Output() edit = new EventEmitter();
  @Output() download = new EventEmitter();
  @Output() remove = new EventEmitter();
  @Output() rename = new EventEmitter();
  @Input() toolButtons = false;
  @Input() title = true;
  @Input() showRename = true;
  @Input() showDelete = true;
  @Input() showVerify = true;
  @Input() selected = false;

  private _page: PageCommunication;
  private _progress: PageEditingProgress = new PageEditingProgress();
  private _static = true;
  private _observer: IntersectionObserver;

  public isVisible = false;
  private _lazyLoad = true;
  @Input() set lazyLoad(value: boolean) {
    this._lazyLoad = value;
    if (!value) {
      this.isVisible = true;
      this.changeDetector.markForCheck();
      if (this._page) {
        this.loadProgressData();
      }
    }
  }
  get lazyLoad() { return this._lazyLoad; }

  @Input() get page() { return this._page; }
  set page(p) {
    if (!this._page || !this._page.equals(p)) {
      this._page = p;

      if (!this._lazyLoad) {
        this.isVisible = true;
      }

      this.changeDetector.markForCheck();

      if (this.isVisible) {
        this.loadProgressData();
      }
    }
  }

  @Input() set progress(p: PageEditingProgress) {
    if (this._progress === p) { return; }

    if (this.progressSub) {
      this.progressSub.unsubscribe();
    }

    if (p) {
      this._progress = p;
      this.changeDetector.markForCheck();
      this._static = false;

      this.progressSub = this._progress.lockedChanged.subscribe((v) => {
        this.changeDetector.markForCheck();
      });
    }
  }
  get progress() { return this._progress; }

  private _color = 'color';
  private _processing = 'original';
  @Input() set color(c) { if (this._color !== c) { this._color = c; this.imgLoaded = false; this.changeDetector.markForCheck(); } }
   @Input() set processing(p) { if (this._processing !== p) { this._processing = p; this.imgLoaded = false; this.changeDetector.markForCheck(); } }
   get color() { return this._color; }
   get processing() { return this._processing; }

  get verifyDisabled() { return !this.progress.isFinished() && !this.progress.isVerified(); }

  imgLoaded = false;

  ngOnInit() {
  }
  ngAfterViewInit() {
    if (this.lazyLoad) {
      this.setupObserver();
    }
  }
  ngOnDestroy() {
    if (this._observer) {
      this._observer.disconnect();
    }
    if (this.progressSub) {
      this.progressSub.unsubscribe();
    }
  }
  private setupObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };
    this._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isVisible = true;
          this.loadProgressData();
          this.changeDetector.markForCheck();
          this._observer.disconnect();
        }
      });
    }, options);

    this._observer.observe(this.elementRef.nativeElement);
  }
  private loadProgressData() {
    if (!this._page) { return; }


    if (this._static) {
      const c = this.http.get(this._page.content_url('page_progress'));
      c.subscribe(
        next => {
          if (this._static) {
            this._progress = PageEditingProgress.fromJson(next);
            this.changeDetector.markForCheck();
          }
        });
    }
  }
  pagePreviewClass() {
    if (this.progress.isVerified()) { return 'verified'; } else
    if (this.progress.isFinished()) { return 'finished'; } else
    if (this.progress.inProgress()) { return 'in-progress'; }
    return '';
  }
  setVerified(b: boolean) {
    if (this.progress.isVerified() === b) { return; }
    const call = this.progress.setVerifyCall(this.page, this.http, b);
    if (!call) { return; }
    call.subscribe(
      r => { this.changeDetector.detectChanges(); },
      err => { this.changeDetector.detectChanges(); },
    );
  }
  verifyToggle() {
    this.setVerified(!this.progress.isVerified());
  }

}
