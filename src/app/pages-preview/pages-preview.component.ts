import { Component, OnInit } from '@angular/core';
import { PagesPreviewService } from './pages-preview.service';
import {EditorService } from '../editor/editor.service';
import {PageCommunication} from '../data-types/communication';
import {Router} from '@angular/router';

@Component({
  selector: 'app-pages-preview',
  templateUrl: './pages-preview.component.html',
  styleUrls: ['./pages-preview.component.css']
})
export class PagesPreviewComponent implements OnInit {
  pages: PageCommunication[] = [];
  errorMessage = '';

  constructor(
    private router: Router,
    private pagesPreviewService: PagesPreviewService,
    private staffService: EditorService) { }

  ngOnInit() {
    this.pagesPreviewService.getPages(this.staffService.bookCom).subscribe(
      pages => this.pages = pages,
      error =>  this.errorMessage = <any>error);
  }

  onPageClick(page: PageCommunication) {
    this.router.navigate(['book', this.staffService.bookCom.book, page.page, 'edit']);
  }

}
