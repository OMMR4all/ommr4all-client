import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {PageCount, PageSelection} from '../book-step-page-selector/book-step-page-selector.component';
import {BookCommunication} from '../../../data-types/communication';
import {TaskWorker} from '../../../editor/task';
import {HttpClient} from '@angular/common/http';

interface RequestBody extends PageSelection {
}

@Component({
  selector: 'app-book-step-stafflines-view',
  templateUrl: './book-step-stafflines-view.component.html',
  styleUrls: ['./book-step-stafflines-view.component.scss']
})
export class BookStepStafflinesViewComponent implements OnInit, OnDestroy {
  readonly requestBody: RequestBody = {
    count: PageCount.Unprocessed,
    pages: [],
  };

  @Input() operation = 'stafflines';
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
