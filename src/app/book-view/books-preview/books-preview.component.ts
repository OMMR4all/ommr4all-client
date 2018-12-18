import {Component, OnInit, ViewChild, ElementRef, Input, OnChanges, EventEmitter, Output} from '@angular/core';
import {ParamMap, Router} from '@angular/router';
import {ActivatedRoute} from '@angular/router';
import {BookCommunication, PageCommunication} from '../../data-types/communication';
import {HttpClient} from '@angular/common/http';
import {ServerStateService} from '../../server-state/server-state.service';

const Sortable: any = require('sortablejs');

@Component({
  selector: 'app-books-preview',
  templateUrl: './books-preview.component.html',
  styleUrls: ['./books-preview.component.css']
})
export class BooksPreviewComponent implements OnInit {
  @ViewChild('previewList') previewList: ElementRef;
  @Output() reload = new EventEmitter();
  @Input() pages: PageCommunication[] = [];
  @Input() book: BookCommunication;
  currentPage: PageCommunication;
  errorMessage = '';
  showUpload = false;
  selectedColor = 'color';
  selectedProcessing = 'original';
  selectDownloadContent = 'annotations';

  loaded = [];

  constructor(
    private http: HttpClient,
    private router: Router,
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

  selectPage(event, page: PageCommunication) {
    this.currentPage = page;
    this.router.navigate(['book', page.book.book, page.page, 'edit']);
  }

  onUpload(show = true) {
    this.showUpload = show;
  }

  onDownload() {
    // window.open(this.bookViewService.currentBook.downloadUrl('annotations.zip'), '_blank');
  }

  onCleanAll() {
    this.pages.forEach(page =>
      this.http.get(page.operation_url('clean')).subscribe(error => this.errorMessage = error as any)
    );
    this.selectedColor = 'color';
    this.selectedProcessing = 'original';
  }

}
