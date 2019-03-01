import {Component, OnInit, ViewChild, ElementRef, Input, OnChanges, EventEmitter, Output, ViewContainerRef} from '@angular/core';
import {Router} from '@angular/router';
import {BookCommunication, PageCommunication} from '../../data-types/communication';
import {HttpClient} from '@angular/common/http';
import {ConfirmCleanAllPagesDialogComponent} from './confirm-clean-all-pages-dialog/confirm-clean-all-pages-dialog.component';
import {BookMeta} from '../../book-list.service';
import {MatDialog} from '@angular/material';

const Sortable: any = require('sortablejs');

@Component({
  selector: 'app-books-preview',
  templateUrl: './books-preview.component.html',
  styleUrls: ['./books-preview.component.css']
})
export class BooksPreviewComponent implements OnInit {
  @ViewChild('previewList') previewList: ElementRef;
  @Output() reload = new EventEmitter();
  @Output() pagesDeleted = new EventEmitter<PageCommunication[]>();
  @Input() pages: PageCommunication[] = [];
  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;
  currentPage: PageCommunication;
  errorMessage = '';
  showUpload = false;
  selectedColor = 'color';
  selectedProcessing = 'original';
  selectDownloadContent = 'annotations.zip';

  loaded = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private modalDialog: MatDialog,
  ) {
  }

  ngOnInit() {
    Sortable.create(this.previewList.nativeElement,
      {
      });
    this.setUnloaded();
  }

  setUnloaded() { this.loaded = this.pages.map(p => false); }
  setLoaded(page: PageCommunication) { this.loaded[this.pages.indexOf(page)] = true; }
  pageLoaded(page: PageCommunication) { return this.loaded[this.pages.indexOf(page)]; }

  selectPage(event: MouseEvent, page: PageCommunication) {
    if (event && event.defaultPrevented) { return; }
    this.currentPage = page;
    this.router.navigate(['book', page.book.book, page.page, 'edit']);
  }

  removePage(page: PageCommunication) {
    this.http.delete(page.operation_url('delete')).subscribe(
      res => {
        this.pagesDeleted.emit([page]);
      }
    );
  }

  onUpload(show = true) {
    this.showUpload = show;
  }

  onDownload() {
    if (this.book) {
      this.http.get(this.book.downloadUrl(this.selectDownloadContent), {responseType: 'blob'}).subscribe(
        res => window.open(URL.createObjectURL(res), '_blank')
      );
    }
  }

  onCleanAll() {
    this.modalDialog.open(ConfirmCleanAllPagesDialogComponent, {
      data: {
        pages: this.pages,
        book: this.bookMeta,
      }
    }).afterClosed().subscribe(
      (result) => {
        if (result) {
          this.reload.emit();
          this.selectedColor = 'color';
          this.selectedProcessing = 'original';
        }
      }
    );
  }

}
