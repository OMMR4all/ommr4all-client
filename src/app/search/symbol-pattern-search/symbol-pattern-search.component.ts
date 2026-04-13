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
import {PatternPdfExportService} from "./pattern-pdf-export.service";
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
  private pdfExportService = inject(PatternPdfExportService);
  @ViewChildren('previewNode') previewNodes: QueryList<PagePreviewComponent>;
  private _subscription = new Subscription();
  readonly book = new BehaviorSubject<BookCommunication>(null);
  private lastSearchedPatternStrings: string[] = [];
  patternsInput = '';
  sortBy: 'count' | 'page' = 'count';
  syllableOnly = true;
  pdfExporting = false;

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

    this.lastSearchedPatternStrings = patterns.map(p => JSON.stringify(p));

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

    if (dataArray.length > 0) {
      this.results.push(...dataArray.map((d: any) => {

        const updatedMatches = (d.matches || []).map((match: any) => {
          const matchPatternStr = JSON.stringify(match.pattern || []);

          let pIdx = this.lastSearchedPatternStrings.indexOf(matchPatternStr);

          if (pIdx === -1) {
            this.lastSearchedPatternStrings.push(matchPatternStr);
            pIdx = this.lastSearchedPatternStrings.length - 1;
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
  async exportPdf() {
    if (this.pdfExporting || this.results.length === 0) return;
    this.pdfExporting = true;
    try {
      await this.pdfExportService.exportToPdf(this.results);
    } finally {
      this.pdfExporting = false;
    }
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
