import {Component, inject, NgZone, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Subscription} from "rxjs";
import {BookCommunication, PageCommunication} from "../../data-types/communication";
import {AlgorithmRequest, AlgorithmTypes} from "../../book-view/book-step/algorithm-predictor-params";
import {PageCount} from "../../book-view/book-step/page-selection";
import {TaskWorker} from "../../editor/task";
import {filter} from "rxjs/operators";
import {PagePreviewComponent} from "../../page-preview/page-preview.component";
import {PatternEditDialogComponent} from "./pattern-edit-dialog/pattern-edit-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {PatternStyleConfig} from "./pattern-style-config/pattern-style-config.component";
@Component({
  selector: 'app-symbol-pattern-search',
  templateUrl: './symbol-pattern-search.component.html',
  styleUrl: './symbol-pattern-search.component.scss',
  standalone: false

})
export class SymbolPatternSearchComponent extends TaskWorker implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private zone = inject(NgZone);
  private dialog = inject(MatDialog);
  @ViewChildren('previewNode') previewNodes: QueryList<PagePreviewComponent>;
  private _subscription = new Subscription();
  readonly book = new BehaviorSubject<BookCommunication>(null);

  patternsInput = '';
  sortBy: 'count' | 'page' = 'count';
  syllableOnly = true;
  results: any[] = [];
  globalStyleConfig: PatternStyleConfig = {
    borderColor: '#000000',
    borderOpacity: 1.0,
    backgroundColor: 'transparent',
    bgOpacity: 0.35,
    labelBgColor: 'transparent',
    labelBgOpacity: 1.0,
    labelBorderColor: 'transparent',
    labelBorderOpacity: 1.0,
    labelTextColor: '#ffffff',
    labelTextOpacity: 1.0,
  };
  onGlobalStyleChange(newConfig: PatternStyleConfig) {
    this.globalStyleConfig = newConfig;
    this.results.forEach(res => {
      res.styles = { ...this.globalStyleConfig };
    });
  }
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

    const patterns: any[] = [];
    const rawPatterns = this.patternsInput.split(';');

    for (const pStr of rawPatterns) {
      if (!pStr.trim()) continue;

      const tokens = pStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const parsedPattern = [];
      let valid = true;

      for (const token of tokens) {
        const match = token.toLowerCase().match(/^(-?\d+)([lg]?)$/);

        if (match) {
          const pitch = parseInt(match[1], 10);
          let conn: number | null = null;

          if (match[2] === 'l') conn = 1;
          if (match[2] === 'g') conn = 0;

          parsedPattern.push([pitch, conn]);
        } else {
          valid = false;
          break;
        }
      }

      if (valid && parsedPattern.length > 0) {
        patterns.push(parsedPattern);
      }
    }

    if (patterns.length === 0) return;

    const request = new AlgorithmRequest();
    request.selection.count = PageCount.All;

    (request.params as any).patterns = patterns;
    (request.params as any).syllable_only = this.syllableOnly;

    this.results.length = 0;
    this.putTask(request);
  }

  private processResults(res: any) {
    const currentBook = this.book.getValue();
    if (!currentBook) return;

    const dataPayload = res.result || res;
    const dataArray = dataPayload.results || [];
    this.results.length = 0;

    const searchedPatternStrings = this.patternsInput.split(';')
      .map(p => p.split(',').map(n => parseInt(n.trim(), 10)))
      .filter(p => p.length > 0 && !p.some(isNaN))
      .map(p => p.join(','));

    if (dataArray.length > 0) {
      this.results.push(...dataArray.map(d => {

        const updatedMatches = (d.matches || []).map((match: any) => {
          const matchPatternStr = (match.pattern || []).join(',');
          let pIdx = searchedPatternStrings.indexOf(matchPatternStr);

          if (pIdx === -1) {
            searchedPatternStrings.push(matchPatternStr);
            pIdx = searchedPatternStrings.length - 1;
          }

          return { ...match, patternIndex: pIdx };
        });

        return {
          ...d,
          matches: updatedMatches,
          styles: { ...this.globalStyleConfig },
          pageCom: new PageCommunication(currentBook, d.page_id)
        };
      }));
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
    if (!res.styles) {
      res.styles = {
        borderColor: '#000000',
        backgroundColor: 'none',
        labelBgColor: '#ffffff',
        labelTextColor: '#000000'
      };
    }

    const dialogRef = this.dialog.open(PatternEditDialogComponent, {
      width: '95vw',
      maxWidth: '1600px',
      height: '95vh',
      maxHeight: '95vh',
      data: res
    });
    dialogRef.afterClosed().subscribe(saved => {
      if (saved) {
      }
    });
  }
}
