import {Component, Input, OnInit} from '@angular/core';

export enum PageCount {
  All = 'all',
  Unprocessed = 'unprocessed',
  Custom = 'custom',
}

export interface PageSelection {
  count: PageCount;
  pages: string[];
}

@Component({
  selector: 'app-book-step-page-selector',
  templateUrl: './book-step-page-selector.component.html',
  styleUrls: ['./book-step-page-selector.component.scss']
})
export class BookStepPageSelectorComponent implements OnInit {
  readonly PageCount = PageCount;
  @Input() selection: PageSelection;

  constructor() { }

  ngOnInit() {
  }

}
