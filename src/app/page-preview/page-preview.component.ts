import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, Input, OnInit} from '@angular/core';
import {PageCommunication} from '../data-types/communication';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';
import {PageEditingProgress} from '../data-types/page-editing-progress';
import {EditorTools} from '../editor/tool-bar/tool-bar-state.service';

@Component({
  selector: 'app-page-preview',
  templateUrl: './page-preview.component.html',
  styleUrls: ['./page-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagePreviewComponent implements OnInit {
  EditorTools = EditorTools;

  private _page: PageCommunication;
  private _progress: PageEditingProgress = new PageEditingProgress();
  private _static = true;
  @Input() get page() { return this._page; }
  set page(p) {
    if (this._page !== p) {
      this._page = p;
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
  @Input() set progress(p: PageEditingProgress) {
    if (p) {
      this._progress = p; this.changeDetector.markForCheck();
      this._static = false;
      this._progress.lockedChanged.subscribe((v) => {
        this.changeDetector.markForCheck();
      });
    }
  }
  get progress() { return this._progress; }

  private _color = 'color';
  private _processing = 'original';
  @Input() set color(c) { this._color = c; this.imgLoaded = false; this.changeDetector.markForCheck(); }
  @Input() set processing(p) { this._processing = p; this.imgLoaded = false; this.changeDetector.markForCheck(); }
  get color() { return this._color; }
  get processing() { return this._processing; }

  imgLoaded = false;

  constructor(
    private http: HttpClient,
    private changeDetector: ChangeDetectorRef,
    ) {
  }

  ngOnInit() {
  }

}
