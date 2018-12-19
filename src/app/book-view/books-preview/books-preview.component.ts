import {Component, OnInit, ViewChild, ElementRef, Input, OnChanges, EventEmitter, Output, ViewContainerRef} from '@angular/core';
import {ParamMap, Router} from '@angular/router';
import {ActivatedRoute} from '@angular/router';
import {BookCommunication, PageCommunication} from '../../data-types/communication';
import {HttpClient} from '@angular/common/http';
import {ServerStateService} from '../../server-state/server-state.service';
import {ConfirmCleanAllPagesDialogComponent} from './confirm-clean-all-pages-dialog/confirm-clean-all-pages-dialog.component';
import {ModalDialogService} from 'ngx-modal-dialog';
import {BehaviorSubject} from 'rxjs';
import {BookMeta} from '../../book-list.service';

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
  @Input() bookMeta: BookMeta;
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
    private modalService: ModalDialogService,
    private viewRef: ViewContainerRef,
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
    if (this.book) {
      this.http.get(this.book.downloadUrl('annotations.zip'), {responseType: 'blob'}).subscribe(
        res => window.open(URL.createObjectURL(res), '_blank')
      );
    }
  }

  onCleanAll() {
    this.modalService.openDialog(this.viewRef, {
      title: 'Clear book "' + this.book.book + '"',
      childComponent: ConfirmCleanAllPagesDialogComponent,
      data: {
        pages: this.pages,
        bookMeta: this.bookMeta,
        onDeleted: () => {
          this.reload.emit();
          this.selectedColor = 'color';
          this.selectedProcessing = 'original';
        }
      }
    });
  }

}
