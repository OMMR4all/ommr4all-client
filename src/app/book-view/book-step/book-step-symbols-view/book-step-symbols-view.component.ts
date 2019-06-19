import {Component, Input, OnInit} from '@angular/core';
import {PageCount, PageSelection} from '../book-step-page-selector/book-step-page-selector.component';
import {TaskWorker} from '../../../editor/task';
import {BookCommunication} from '../../../data-types/communication';
import {HttpClient} from '@angular/common/http';

interface RequestBody extends PageSelection {
}

@Component({
  selector: 'app-book-step-symbols-view',
  templateUrl: './book-step-symbols-view.component.html',
  styleUrls: ['./book-step-symbols-view.component.scss']
})
export class BookStepSymbolsViewComponent implements OnInit {
  readonly requestBody: RequestBody = {
    count: PageCount.Unprocessed,
    pages: [],
  };

  @Input() book: BookCommunication;
  task: TaskWorker;

  constructor(
    private http: HttpClient,
  ) {
  }

  ngOnInit() {
    this.task = new TaskWorker('symbols', this.http, this.book, this.requestBody);
    this.task.startStatusPoller(2000);
  }

  ngOnDestroy(): void {
    this.task.stopStatusPoller();
  }
}
