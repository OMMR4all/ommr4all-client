import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {PagesPreviewService} from './pages-preview.service';
import {EditorService} from '../editor.service';
import {PageCommunication} from '../../data-types/communication';
import {Router} from '@angular/router';
import {PageEditingProgress} from '../../data-types/page-editing-progress';

@Component({
  selector: 'app-pages-preview',
  templateUrl: './pages-preview.component.html',
  styleUrls: ['./pages-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagesPreviewComponent implements OnInit {
  private _allPages: Array<PageCommunication> = [];
  pages: Array<{page: PageCommunication, progress: PageEditingProgress}> = [];
  errorMessage = '';
  private _currentPage: PageCommunication;
  private _currentPageProgress: PageEditingProgress;
  @Input() set currentPage(page: PageCommunication) { this._currentPage = page; this._updatePages(); }
  @Input() set currentPageProgress(progess: PageEditingProgress) { this._currentPageProgress = progess; this._updatePages(); }

  constructor(
    private router: Router,
    private pagesPreviewService: PagesPreviewService,
    private staffService: EditorService,
    private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    this.pagesPreviewService.getPages(this.staffService.bookCom).subscribe(
      pages => { this._allPages = pages; this._updatePages(); },
      error =>  this.errorMessage = <any>error);
  }

  onPageClick(page: PageCommunication) {
    this.router.navigate(['book', this.staffService.bookCom.book, page.page, 'edit']);
  }

  _updatePages() {
    this.pages = this._allPages.map(page => {
      if (page.equals(this._currentPage)) {
        return {page: page, progress: this._currentPageProgress};
      } else {
        return {page: page, progress: null};
      }

    });
    this.changeDetector.markForCheck();
  }
}
