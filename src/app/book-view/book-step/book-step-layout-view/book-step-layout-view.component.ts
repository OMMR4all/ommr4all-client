import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {PageCount, PageSelection} from '../book-step-page-selector/book-step-page-selector.component';
import {TaskWorker} from '../../../editor/task';
import {BookCommunication} from '../../../data-types/communication';
import {HttpClient} from '@angular/common/http';

enum LayoutModes {
  Simple = 'simple',
  Complex = 'complex',
}

interface RequestBody extends PageSelection {
  layoutMode: LayoutModes,
}

@Component({
  selector: 'app-book-step-layout-view',
  templateUrl: './book-step-layout-view.component.html',
  styleUrls: ['./book-step-layout-view.component.scss']
})
export class BookStepLayoutViewComponent implements OnInit, OnDestroy {
  readonly LayoutModes = LayoutModes;
  readonly requestBody: RequestBody = {
    count: PageCount.Unprocessed,
    pages: [],
    layoutMode: LayoutModes.Complex,
  };

  @Input() operation = 'layout';
  @Input() book: BookCommunication;
  task: TaskWorker;

  constructor(
    private http: HttpClient,
  ) {
  }

  ngOnInit() {
    this.task = new TaskWorker(this.operation, this.http, this.book, this.requestBody);
    this.task.startStatusPoller(2000);
  }

  ngOnDestroy(): void {
    this.task.stopStatusPoller();
  }
}
