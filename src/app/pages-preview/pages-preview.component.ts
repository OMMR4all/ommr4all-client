import { Component, OnInit } from '@angular/core';
import {ServerUrlsService} from '../server-urls.service';
import { PagesPreviewService, PagePreview } from './pages-preview.service';
import {StaffsService } from '../staffs.service';

@Component({
  selector: 'app-pages-preview',
  templateUrl: './pages-preview.component.html',
  styleUrls: ['./pages-preview.component.css']
})
export class PagesPreviewComponent implements OnInit {
  pages: PagePreview[] = [];
  errorMessage = '';

  constructor(private pagesPreviewService: PagesPreviewService, private staffService: StaffsService) { }

  ngOnInit() {
    this.pagesPreviewService.getPages('demo').subscribe(
      pages => this.pages = pages,
      error =>  this.errorMessage = <any>error);
  }

  onPageClick(page: PagePreview) {
    this.staffService.select('demo', page.id);
  }

}
