import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject, QueryList, ElementRef, ViewChildren} from '@angular/core';
import {PagesPreviewService} from './pages-preview.service';
import {EditorService} from '../editor.service';
import {BookCommunication, PageCommunication} from '../../data-types/communication';
import {Router} from '@angular/router';
import {PageEditingProgress} from '../../data-types/page-editing-progress';
import {Page} from "../../data-types/page/page";

@Component({
    selector: 'app-pages-preview',
    templateUrl: './pages-preview.component.html',
    styleUrls: ['./pages-preview.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PagesPreviewComponent {
  private router = inject(Router);
  private pagesPreviewService = inject(PagesPreviewService);
  private changeDetector = inject(ChangeDetectorRef);

  private _allPages: PageCommunication[] = [];
  pages: {page: PageCommunication, progress: PageEditingProgress}[] = [];
  errorMessage = '';
  private _bookCom = new BookCommunication('');
  private _currentPage: PageCommunication;
  private _currentPageProgress: PageEditingProgress;
  @ViewChildren('pageItem') pageElements: QueryList<ElementRef>;
  @Input() urlSuffix = 'edit';
  @Input() set currentPage(page: PageCommunication) { this._currentPage = page; this._updatePages(); }
  @Input() set currentPageProgress(progess: PageEditingProgress) { this._currentPageProgress = progess; this._updatePages(); }
  @Input() set bookCom(bookCom: BookCommunication) {
    if (bookCom.equals(this._bookCom)) { return; }
    this._bookCom = bookCom;
    if (bookCom.book.length > 0) {
      this.pagesPreviewService.getPages(bookCom).subscribe(
        pages => {
          this._allPages = pages;
          this._updatePages();
        },
        error => this.errorMessage = error as any);
    }
  }

  onPageClick(page: PageCommunication) {
    this.router.navigate(['book', page.book.book, 'page', page.page, this.urlSuffix]);
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
    setTimeout(() => {
      this.scrollToSelected();
    }, 0);
  }
  private scrollToSelected() {
    const selectedIndex = this.pages.findIndex(p => p.page.equals(this._currentPage));

    if (selectedIndex !== -1) {
      const elementArray = this.pageElements.toArray();
      const targetElement = elementArray[selectedIndex];

      if (targetElement) {
        targetElement.nativeElement.scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }
  pageId(index, item) { return item.page.page; }

  selected(page: PageCommunication) {
    return page.equals(this._currentPage);
  }
}
