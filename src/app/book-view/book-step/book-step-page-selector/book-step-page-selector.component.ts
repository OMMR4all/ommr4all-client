import {Component, Input, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {BookCommunication} from '../../../data-types/communication';
import {AlgorithmTypes} from '../algorithm-predictor-params';
import {PageSelection, PageCount} from '../page-selection';

interface PageSelectionResult {
  pages: string[];
  pageCount: string;
  singlePage: boolean;
  book: string;
  totalPages: number;
}

@Component({
  selector: 'app-book-step-page-selector',
  templateUrl: './book-step-page-selector.component.html',
  styleUrls: ['./book-step-page-selector.component.scss']
})
export class BookStepPageSelectorComponent implements OnInit {
  readonly PageCount = PageCount;
  readonly pageSelectionResult = new BehaviorSubject<PageSelectionResult>(null);
  private _pageSelectionRequest: Subscription;
  @Input() operation: AlgorithmTypes;
  @Input() selection: PageSelection;
  @Input() bookCom: BookCommunication;

  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {
    this.updateSelectionCount();
  }

  updateSelectionCount() {
    this.pageSelectionResult.next(null);
    if (this._pageSelectionRequest) {
      this._pageSelectionRequest.unsubscribe();
    }
    this._pageSelectionRequest = this.http.post<PageSelectionResult>(this.bookCom.operationUrl(this.operation, 'page_selection'), this.selection).subscribe(
      r => {
        this.pageSelectionResult.next(r);
      }
    );
  }
}
