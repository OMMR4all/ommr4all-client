import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {BookCommunication} from '../../../data-types/communication';
import {AlgorithmTypes, metaForAlgorithmType} from '../algorithm-predictor-params';
import {PageSelection, PageCount} from '../page-selection';

interface PageSelectionPerOperation {
  operation: AlgorithmTypes;
  pages: number;
}

interface PageSelectionResult {
  pages: string[];
  perOperation: PageSelectionPerOperation[];
  pageCount: string;
  singlePage: boolean;
  book: string;
  totalPages: number;
}

@Component({
    selector: 'app-book-step-page-selector',
    templateUrl: './book-step-page-selector.component.html',
    styleUrls: ['./book-step-page-selector.component.scss'],
    standalone: false
})
export class BookStepPageSelectorComponent implements OnInit, OnChanges {
  private http = inject(HttpClient);

  readonly PageCount = PageCount;
  readonly pageSelectionResult = new BehaviorSubject<PageSelectionResult>(null);
  private _pageSelectionRequest: Subscription;
  @Input() operation: AlgorithmTypes;
  // The algorithms the selection is evaluated against. The workflow passes all of its
  // enabled steps here; callers that operate on a single step may omit it, in which case
  // `operation` is used.
  @Input() operations: AlgorithmTypes[];
  @Input() selection: PageSelection;
  @Input() bookCom: BookCommunication;

  ngOnInit() {
    this.updateSelectionCount();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Enabling/disabling a step in the configurator changes which algorithms the count is
    // based on. ngOnInit already covers the initial request.
    if ((changes.operations && !changes.operations.firstChange)
      || (changes.operation && !changes.operation.firstChange)) {
      this.updateSelectionCount();
    }
  }

  labelFor(operation: AlgorithmTypes): string {
    const meta = metaForAlgorithmType.get(operation);
    return meta ? meta.label : operation;
  }

  updateSelectionCount() {
    this.pageSelectionResult.next(null);
    if (this._pageSelectionRequest) {
      this._pageSelectionRequest.unsubscribe();
    }
    const body = {...this.selection, operations: this.operations || [this.operation]};
    this._pageSelectionRequest = this.http.post<PageSelectionResult>(
      this.bookCom.operationUrl(this.operation, 'page_selection'), body).subscribe(
      r => {
        this.pageSelectionResult.next(r);
      }
    );

  }

  manualSelect() {

  }
}
