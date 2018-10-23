import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {BookViewService } from '../book-view.service';
import {switchMap} from 'rxjs/operators';
import {ParamMap, Router} from '@angular/router';
import {ActivatedRoute} from '@angular/router';
import {PageCommunication} from '../../data-types/communication';
import {Http} from '@angular/http';

const Sortable: any = require('sortablejs');

@Component({
  selector: 'app-books-preview',
  templateUrl: './books-preview.component.html',
  styleUrls: ['./books-preview.component.css']
})
export class BooksPreviewComponent implements OnInit {
  @ViewChild('previewList') previewList: ElementRef;
  pages: PageCommunication[] = [];
  currentPage: PageCommunication;
  errorMessage = '';
  showUpload = false;
  selectedColor = 'color';
  selectedProcessing = 'original';
  selectDownloadContent = 'annotations';

  loaded = [];

  constructor(
    private http: Http,
    private router: Router,
    private route: ActivatedRoute,
    public bookViewService: BookViewService) { }

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
          return this.bookViewService.getPages(params.get('book_id'));
        }
      )
    ).subscribe(
      pages => { this.pages = pages; this.setUnloaded(); },
      error =>  this.errorMessage = <any>error
    );
    Sortable.create(this.previewList.nativeElement,
      {
      });
  }

  setUnloaded() { this.loaded = this.pages.map(p => false); }
  setLoaded(page: PageCommunication) { this.loaded[this.pages.indexOf(page)] = true; }
  pageLoaded(page: PageCommunication) { return this.loaded[this.pages.indexOf(page)]; }

  selectPage(event, page: PageCommunication) {
    this.currentPage = page;
    this.router.navigate(['book', this.bookViewService.currentBook.book, page.page, 'edit']);
  }

  onUpload(show = true) {
    this.showUpload = show;
  }

  onDownload() {
    window.open(this.bookViewService.currentBook.downloadUrl('annotations.zip'), '_blank');
  }

  onCleanAll() {
    this.pages.forEach(page =>
      this.http.get(page.operation_url('clean')).subscribe(error => this.errorMessage = error as any)
    );
    this.selectedColor = 'color';
    this.selectedProcessing = 'original';
  }

}
