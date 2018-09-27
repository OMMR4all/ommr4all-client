import { Component, OnInit } from '@angular/core';
import {ServerUrls} from '../server-urls';
import { PagesPreviewService } from './pages-preview.service';
import {StaffsService } from '../staffs.service';
import {Page} from '../data-types/page';
import {Router} from '@angular/router';

@Component({
  selector: 'app-pages-preview',
  templateUrl: './pages-preview.component.html',
  styleUrls: ['./pages-preview.component.css']
})
export class PagesPreviewComponent implements OnInit {
  pages: Page[] = [];
  errorMessage = '';

  constructor(
    private router: Router,
    private pagesPreviewService: PagesPreviewService,
    private staffService: StaffsService) { }

  ngOnInit() {
    this.pagesPreviewService.getPages(this.staffService.book).subscribe(
      pages => this.pages = pages,
      error =>  this.errorMessage = <any>error);
  }

  onPageClick(page: Page) {
    this.router.navigate(['book', this.staffService.book.book, page.page, 'edit']);
  }

}
