import {
  Component, OnInit, OnChanges, ViewChild, ElementRef, Input, EventEmitter, Output, HostListener, ViewChildren, QueryList, inject,
  ChangeDetectorRef, DestroyRef, SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import {Router} from '@angular/router';
import {BookCommunication, PageCommunication} from '../../data-types/communication';
import { HttpClient } from '@angular/common/http';
import {ConfirmCleanAllPagesDialogComponent} from './confirm-clean-all-pages-dialog/confirm-clean-all-pages-dialog.component';
import {BookMeta} from '../../book-list.service';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import {ConfirmDeletePageDialogComponent} from './confirm-delete-page-dialog/confirm-delete-page-dialog.component';
import {RenamePageDialogComponent} from './rename-page-dialog/rename-page-dialog.component';
import {arrayFromSet, copyFromSet, setFromList} from '../../utils/copy';
import {ExportPagesDialogComponent} from './export-pages-dialog/export-pages-dialog.component';
import {BehaviorSubject, forkJoin} from 'rxjs';
import {filter} from 'rxjs/operators';
import {RenameAllPagesDialogComponent} from './rename-all-pages-dialog/rename-all-pages-dialog.component';
import {BookPermissionFlag, BookPermissionFlags} from '../../data-types/permissions';
import {PagePreviewComponent} from '../../page-preview/page-preview.component';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ScrollingModule } from '@angular/cdk/scrolling';
@Component({
    selector: 'app-books-preview',
    templateUrl: './books-preview.component.html',
    styleUrls: ['./books-preview.component.scss'],
    standalone: false
})
export class BooksPreviewComponent implements OnInit, OnChanges, AfterViewInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private modalDialog = inject(MatDialog);
  private _itemsPerRow = new BehaviorSubject<number>(1); // Default
  private resizeObserver: ResizeObserver;
  @ViewChild('previewList') previewList: ElementRef;
  @ViewChild('previewViewport', { read: ElementRef }) viewport: ElementRef;
  @ViewChild('previewViewport') cdkViewport: CdkVirtualScrollViewport;
  private destroyRef = inject(DestroyRef);
  @ViewChildren(PagePreviewComponent) pagePreviews: QueryList<PagePreviewComponent>;
  @Output() reload = new EventEmitter();
  @Output() pagesDeleted = new EventEmitter<PageCommunication[]>();
  @Output() pagesChanged = new EventEmitter<PageCommunication[]>();
  @Output() switchPagination = new EventEmitter<PageEvent>();
  @Input() pages: PageCommunication[] = [];
  @Input() bookCom: BehaviorSubject<BookCommunication>;
  @Input() bookMeta: BookMeta;
  @Input() totalPages: number;
  @Input() pageIndex: number;
  currentPage: PageCommunication;
  errorMessage = '';
  showUpload = false;
  selectedColor = 'color';
  selectedProcessing = 'original';
  pageRowsList: PageCommunication[][] = [];
  readonly selectedPages = new Set<PageCommunication>();

  get book() { return this.bookCom.getValue(); }
  get selectedPagePreviews() { return this.pagePreviews.filter(pp => this.selectedPages.has(pp.page)); }


  loaded = [];
  constructor(private cdr: ChangeDetectorRef) {}
  ngOnInit() {
    this.setUnloaded();
    this.updatePageRows();
  }
  ngAfterViewInit() {
    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      const newCount = Math.floor(width / 180) || 1;

      if (newCount !== this._itemsPerRow.value) {
        this._itemsPerRow.next(newCount);
        this.updatePageRows();
        this.cdr.detectChanges();
      }
    });

    resizeObserver.observe(this.viewport.nativeElement);

    this.destroyRef.onDestroy(() => {
      resizeObserver.disconnect();
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['pages'] && this.pages) {
      this.setUnloaded();
      this.updatePageRows();

      setTimeout(() => {
        if (this.cdkViewport) {
          this.cdkViewport.checkViewportSize();
        }
      });
    }
  }
  trackRow(index: number, row: PageCommunication[]) {
    return index;
  }
  bookCommentsViewPath() { return '/book/' + this.book.book + '/comments'; }
  setUnloaded() { this.loaded = this.pages.map(p => false); }
  setLoaded(page: PageCommunication) { this.loaded[this.pages.indexOf(page)] = true; }
  pageLoaded(page: PageCommunication) { return this.loaded[this.pages.indexOf(page)]; }
  showEditMeta() { return (new BookPermissionFlags(this.bookMeta.permissions)).has(BookPermissionFlag.EditBookMeta); }
  showRenamePage() { return (new BookPermissionFlags(this.bookMeta.permissions)).has(BookPermissionFlag.RenamePages); }
  showDeletePage() { return (new BookPermissionFlags(this.bookMeta.permissions)).has(BookPermissionFlag.DeletePages); }
  showAutoRenamePage() { return this.showRenamePage(); }
  showUploadPage() { return (new BookPermissionFlags(this.bookMeta.permissions)).has(BookPermissionFlag.AddPages); }
  showVerifyPage() { return (new BookPermissionFlags(this.bookMeta.permissions)).has(BookPermissionFlag.VerifyPage); }
  private updatePageRows() {
    const perRow = this._itemsPerRow.value;
    const rows = [];
    for (let i = 0; i < this.pages.length; i += perRow) {
      rows.push(this.pages.slice(i, i + perRow));
    }
    this.pageRowsList = rows;
  }
  editPage(page: PageCommunication) {
    this.router.navigate(['book', page.book.book, 'page', page.page, 'edit']);
  }
  trackPage(index: number, page: PageCommunication) {
    return page.page;
  }
  selectPage(event: MouseEvent, page: PageCommunication) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (event?.shiftKey && this.currentPage) {
      const start = this.pages.indexOf(this.currentPage);
      const end = this.pages.indexOf(page);

      const low = Math.min(start, end);
      const high = Math.max(start, end);

      this.selectedPages.clear();
      for (let i = low; i <= high; i++) {
        this.selectedPages.add(this.pages[i]);
      }
      return;
    }

    if (event?.ctrlKey || event?.metaKey) {
      if (this.selectedPages.has(page)) {
        this.selectedPages.delete(page);
        this.currentPage = this.selectedPages.size > 0 ? Array.from(this.selectedPages).pop() : null;
      } else {
        this.selectedPages.add(page);
        this.currentPage = page;
      }
      return;
    }

    this.selectedPages.clear();
    this.selectedPages.add(page);
    this.currentPage = page;
  }

  removePage(page: PageCommunication) {
    if (!page) { return; }
    this.modalDialog.open(ConfirmDeletePageDialogComponent, {
      data: {
        book: this.bookMeta,
        pages: [page],
      }
    }).afterClosed().subscribe(
      (success: boolean) => {
        if (success) {
          this.pagesDeleted.emit([page]);
        }
      }
    );
  }

  renamePage(page: PageCommunication) {
    this.modalDialog.open(RenamePageDialogComponent, {
      data: {
        name: page.page,
        pageCom: page,
      },
    }).afterClosed().subscribe(
      (success) => {
        if (success) {
          this.pagesChanged.emit([page]);
        }
      }
    );
  }

  verifyToggle() {
    const pps = this.selectedPagePreviews.filter(pp => !pp.verifyDisabled);
    const allVerified = pps.map(pp => pp.progress.isVerified()).reduce((previousValue, currentValue) => previousValue && currentValue);
    pps.forEach(pp => pp.setVerified(!allVerified));
  }

  onUpload(show = true) { this.showUpload = show; }
  onDownloadAll() { this.onDownload(new Set<PageCommunication>()); }
  onDownloadPage(page: PageCommunication) { this.onDownload(setFromList([page])); }

  onDownload(pages: Set<PageCommunication>) {
    this.modalDialog.open(ExportPagesDialogComponent, {
      data: {
        book: this.book,
        bookMeta: this.bookMeta,
        pages: arrayFromSet(pages),
      }
    });
  }

  onSelectAll() {
    copyFromSet(this.selectedPages, setFromList(this.pages));
  }
  get pageRows(): PageCommunication[][] {
    const perRow = this._itemsPerRow.value;
    const rows = [];
    for (let i = 0; i < this.pages.length; i += perRow) {
      rows.push(this.pages.slice(i, i + perRow));
    }
    return rows;
  }


  onClearSelection() {
    this.selectedPages.clear();
    this.currentPage = null;
  }

  onAutoRenamePages(pages: Set<PageCommunication>) {
    if (pages === null) { pages = new Set<PageCommunication>(); }
    const pagesToChange = this.pages.filter(p => pages.has(p));
    this.modalDialog.open(RenameAllPagesDialogComponent, {
      data: {
        name: this.book.book,
        pages: pagesToChange,
        book: this.bookCom.getValue(),
      },
    }).afterClosed().subscribe(
      (success) => {
        if (success) {
          this.pagesChanged.emit(pagesToChange);
        }
      }
    );
  }

  onSelectionResetAnnotations() {
    if (this.selectedPages.size === 0) { return; }
    this.modalDialog.open(ConfirmCleanAllPagesDialogComponent, {
      data: {
        pages: arrayFromSet(this.selectedPages),
        book: this.bookMeta,
      }
    }).afterClosed().subscribe(
      (result) => {
        if (result) {
          this.onClearSelection();
          this.reload.emit();
          this.selectedColor = 'color';
          this.selectedProcessing = 'original';
        }
      }
    );
  }

  onSelectionRemovePages() {
    if (this.selectedPages.size === 0) { return; }
    this.modalDialog.open(ConfirmDeletePageDialogComponent, {
      data: {
        book: this.bookMeta,
        pages: arrayFromSet(this.selectedPages),
      }
    }).afterClosed().subscribe(
      (success: boolean) => {
        if (success) {
          this.pagesDeleted.emit(arrayFromSet(this.selectedPages));
          this.onClearSelection();
        }
      }
    );
  }

  paginatorChanged(e: PageEvent) {
    this.switchPagination.emit(e);
  }

  @HostListener('document:keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (event.defaultPrevented) { return; }
    if (event.code === 'KeyA' && event.ctrlKey) {
      this.onSelectAll();
      event.preventDefault();
    } else if (event.code === 'Escape') {
      this.onClearSelection();
      event.preventDefault();
    } else if (event.code === 'Enter') {
      if (this.currentPage) {
        this.editPage(this.currentPage);
      }
      event.preventDefault();
    } else if (event.code === 'ArrowRight') {
      if (!this.currentPage) {
        this.selectPage(null, this.pages[0]);
      } else {
        const idx = this.pages.indexOf(this.currentPage);
        if (idx < this.pages.length - 1) {
          this.selectPage(null, this.pages[idx + 1]);
        }
      }
      event.preventDefault();
    } else if (event.code === 'ArrowLeft') {
      if (!this.currentPage) {
        this.selectPage(null, this.pages[this.pages.length - 1]);
      } else {
        const idx = this.pages.indexOf(this.currentPage);
        if (idx > 0) {
          this.selectPage(null, this.pages[idx - 1]);
        }
      }
      event.preventDefault();
    }
  }

  viewPageTranscription(page: PageCommunication) {
    this.router.navigate(['book', page.book.book, 'page', page.page, 'view']);
  }
}
