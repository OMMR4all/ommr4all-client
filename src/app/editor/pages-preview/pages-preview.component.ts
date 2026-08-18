import {
  AfterViewChecked,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject,
  QueryList,
  ElementRef,
  ViewChildren
} from '@angular/core';
import {PagesPreviewService} from './pages-preview.service';
import {EditorService} from '../editor.service';
import {BookCommunication, PageCommunication} from '../../data-types/communication';
import {Router} from '@angular/router';
import {PageEditingProgress} from '../../data-types/page-editing-progress';
import {Page} from "../../data-types/page/page";
import {Subscription} from 'rxjs';
import {PageAssignmentsService} from '../../page-assignments.service';
import {AuthenticationService} from '../../authentication/authentication.service';
import {assigneesByPage, PagePreviewAssignee} from '../../data-types/page-assignments';

@Component({
    selector: 'app-pages-preview',
    templateUrl: './pages-preview.component.html',
    styleUrls: ['./pages-preview.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PagesPreviewComponent implements AfterViewChecked, OnDestroy {
  private router = inject(Router);
  private pagesPreviewService = inject(PagesPreviewService);
  private changeDetector = inject(ChangeDetectorRef);
  private assignmentsService = inject(PageAssignmentsService);
  private auth = inject(AuthenticationService);
  private _subscriptions = new Subscription();

  private _allPages: PageCommunication[] = [];
  pages: {page: PageCommunication, progress: PageEditingProgress}[] = [];
  errorMessage = '';
  private _bookCom = new BookCommunication('');
  private _currentPage: PageCommunication;
  private _currentPageProgress: PageEditingProgress;
  private _scrollPending = false;
  private _lastScrolledTo: PageCommunication = null;
  private _assignees = new Map<string, PagePreviewAssignee[]>();
  @ViewChildren('pageItem') pageElements: QueryList<ElementRef>;
  @Input() urlSuffix = 'edit';
  @Input() set currentPage(page: PageCommunication) { this._currentPage = page; this._updatePages(); }
  @Input() set currentPageProgress(progess: PageEditingProgress) { this._currentPageProgress = progess; this._updatePages(); }
  @Input() set bookCom(bookCom: BookCommunication) {
    if (bookCom.equals(this._bookCom)) { return; }
    this._bookCom = bookCom;
    this.assignmentsService.selectOrRefresh(bookCom);
    if (bookCom.book.length > 0) {
      this.pagesPreviewService.getPages(bookCom).subscribe(
        pages => {
          this._allPages = pages;
          this._updatePages();
        },
        error => this.errorMessage = error as any);
    }
  }

  constructor() {
    this._subscriptions.add(this.assignmentsService.stateObs.subscribe(index => {
      this._assignees = assigneesByPage(index, this.auth.username);
      this.changeDetector.markForCheck();
    }));
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  assigneesOf(page: PageCommunication): PagePreviewAssignee[] {
    return this._assignees.get(page.page) || [];
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
    if (this._currentPage && this._currentPage.page.length > 0 && !this._currentPage.equals(this._lastScrolledTo)) {
      // the page list and the current page arrive independently, so remember the request and
      // perform it as soon as both are known and the list is rendered (see ngAfterViewChecked)
      this._scrollPending = true;
    }
    this.changeDetector.markForCheck();
  }

  ngAfterViewChecked() {
    if (!this._scrollPending) { return; }
    if (this.scrollToSelected()) {
      this._scrollPending = false;
      this._lastScrolledTo = this._currentPage;
    }
  }

  private scrollToSelected(): boolean {
    if (!this.pageElements) { return false; }
    const selectedIndex = this.pages.findIndex(p => p.page.equals(this._currentPage));
    if (selectedIndex < 0) { return false; }

    const targetElement = this.pageElements.toArray()[selectedIndex];
    if (!targetElement) { return false; }

    const element: HTMLElement = targetElement.nativeElement;
    const container = element.parentElement;  // .page-list, the scrolling container
    if (!container) { return false; }

    const containerRect = container.getBoundingClientRect();
    if (containerRect.height === 0) { return false; }  // not laid out yet, retry on the next check

    const elementRect = element.getBoundingClientRect();
    // scroll the list only (instead of scrollIntoView, which also scrolls all ancestors)
    container.scrollTop += (elementRect.top - containerRect.top) - (containerRect.height - elementRect.height) / 2;
    return true;
  }
  pageId(index, item) { return item.page.page; }

  selected(page: PageCommunication) {
    return page.equals(this._currentPage);
  }
}
