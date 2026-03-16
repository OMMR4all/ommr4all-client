import {ChangeDetectorRef, Component, inject, NgZone, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Subscription} from "rxjs";
import {BookCommunication, PageCommunication} from "../../data-types/communication";
import {MatError, MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import { FormsModule } from '@angular/forms';
import {MatOption, MatSelect} from "@angular/material/select";
import {MatIcon} from "@angular/material/icon";
import {MatButton} from "@angular/material/button";
import {AlgorithmRequest, AlgorithmTypes} from "../../book-view/book-step/algorithm-predictor-params";
import {PageCount} from "../../book-view/book-step/page-selection";
import {TaskWorker} from "../../editor/task";
import {filter} from "rxjs/operators";
import {MatProgressBar} from "@angular/material/progress-bar";
import {DecimalPipe} from "@angular/common";
import {PagePreviewComponent} from "../../page-preview/page-preview.component";
import {PatternEditDialogComponent} from "./pattern-edit-dialog/pattern-edit-dialog.component";
import {MatDialog} from "@angular/material/dialog";
@Component({
  selector: 'app-symbol-pattern-search',
  templateUrl: './symbol-pattern-search.component.html',
  styleUrl: './symbol-pattern-search.component.scss',
  standalone: false

})
export class SymbolPatternSearchComponent extends TaskWorker implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private zone = inject(NgZone); // <--- INJECT NgZone
  private dialog = inject(MatDialog); // <--- Inject Dialog
  @ViewChildren('previewNode') previewNodes: QueryList<PagePreviewComponent>;
  private _subscription = new Subscription();
  readonly book = new BehaviorSubject<BookCommunication>(null);

  patternsInput = '';
  sortBy: 'count' | 'page' = 'count';

  results: any[] = [];

  constructor() {
    super(AlgorithmTypes.SymbolPatternMatcher, inject(HttpClient), undefined);

    this._subscription.add(this.book.pipe(filter(b => !!b)).subscribe(book => {
      (this as any).operationUrl = book;
    }));
  }

  ngOnInit() {
    this._subscription.add(this.route.paramMap.subscribe(params => {
      const bookId = params.get('book_id');
      if (bookId) {
        this.book.next(new BookCommunication(bookId));
      }
    }));

    this._subscription.add(this.taskFinished.subscribe(res => {
      this.zone.run(() => {
        if (res) {
          this.processResults(res);
        }
      });
    }));
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
    this.stopStatusPoller(true);
  }
  ngAfterViewInit() {
    this.previewNodes.changes.subscribe((comps: QueryList<PagePreviewComponent>) => {
      setTimeout(() => {
        comps.forEach(preview => {
          if (!preview.isVisible) {
            preview.isVisible = true;

            if (typeof preview['loadProgressData'] === 'function') {
              preview['loadProgressData']();
            }

            if (preview['changeDetector']) {
              preview['changeDetector'].markForCheck();
              preview['changeDetector'].detectChanges();
            }
          }
        });
      }, 50);
    });
  }
  startSearch() {
    if (!this.patternsInput) return;
    const patterns = this.patternsInput.split(';')
      .map(p => p.split(',').map(n => parseInt(n.trim(), 10)))
      .filter(p => p.length > 0 && !p.some(isNaN));

    const request = new AlgorithmRequest();
    request.selection.count = PageCount.All;
    (request.params as any).patterns = patterns;

    this.results.length = 0;
    this.putTask(request);
  }

  private processResults(res: any) {
    const currentBook = this.book.getValue();
    if (!currentBook) return;
    console.log(res)

    const dataPayload = res.result || res;
    const dataArray = dataPayload.results || [];
    this.results.length = 0;

    if (dataArray.length > 0) {
      this.results.push(...dataArray.map(d => ({
        ...d,
        pageCom: new PageCommunication(currentBook, d.page_id)
      })));
      this.sortResults();
    }
  }

  sortResults() {
    if (this.sortBy === 'count') {
      this.results.sort((a, b) => b.total_count - a.total_count);
    } else {
      this.results.sort((a, b) => a.page_id.localeCompare(b.page_id));
    }
  }

  getPatternColor(pattern: number[]): string {
    if (!pattern) return 'red';
    const s = pattern.join(',');
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
    let hash = 0;
    for (let i = 0; i < s.length; i++) { hash = s.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  }
  openEditDialog(res: any) {
    const dialogRef = this.dialog.open(PatternEditDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      data: res // Pass the exact result object into the dialog!
    });

    dialogRef.afterClosed().subscribe(saved => {
      if (saved) {
        // Optional: Show a snackbar saying "Saved successfully!"
      }
    });
  }
}
